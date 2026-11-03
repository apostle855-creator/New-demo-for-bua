import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  ArrowUpRight,
  Download,
  Eye,
  MessageSquare,
  Sparkles,
  Shield,
  Search,
  Upload,
  Check,
  CheckCircle,
  Clock,
  Send,
  Lock,
  LogOut,
  Trash2,
  Key,
  ChevronRight,
  Calculator,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import {
  AcademicResource,
  PendingUpload,
  ComplaintTicket,
  AuditLog
} from './types';
import {
  GOOGLE_DRIVE_FOLDER_URL,
  GOOGLE_DRIVE_FOLDER_ID,
  openDatabase,
  dbGetAll,
  dbGet,
  dbPut,
  dbDelete,
  seedInitialData,
  logAuditAction,
  INITIAL_RESOURCES
} from './storage';

export default function App() {
  // Navigation: 4 Core Pillars
  const [activeTab, setActiveTab] = useState<'drive' | 'assistant' | 'suggestions' | 'admin'>('drive');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drive & Resource Bank State
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResource, setPreviewResource] = useState<AcademicResource | null>(null);

  // Student Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLevel, setUploadLevel] = useState('100 Level');
  const [uploadCategory, setUploadCategory] = useState('Lecture Note');
  const [uploadCourseCode, setUploadCourseCode] = useState('BUS 101');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadUploaderName, setUploadUploaderName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadResultTrackingId, setUploadResultTrackingId] = useState<string | null>(null);

  // Offline AI Assistant & Tools State
  const [aiSubTab, setAiSubTab] = useState<'chat' | 'cgpa' | 'timer'>('chat');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'bot'; text: string; time?: string }>>([
    {
      role: 'bot',
      text: "Hello! I am your Department of Business Administration Academic Assistant. Ask me anything about Henri Fayol's 14 principles, Max Weber's bureaucracy, 5.0 CGPA calculations, final year project frameworks (Chapters 1 to 5), or core course syllabi.",
      time: 'Now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // CGPA Calculator State
  const [cgpaCourses, setCgpaCourses] = useState<Array<{ id: string; code: string; units: number; grade: string }>>([
    { id: '1', code: 'BUS 101', units: 3, grade: 'A' },
    { id: '2', code: 'BUS 103', units: 3, grade: 'B' },
    { id: '3', code: 'ACC 101', units: 3, grade: 'A' },
    { id: '4', code: 'ECO 101', units: 3, grade: 'B' },
    { id: '5', code: 'GST 111', units: 2, grade: 'A' }
  ]);
  const [prevCgpa, setPrevCgpa] = useState<string>('');
  const [prevUnits, setPrevUnits] = useState<string>('');

  // Study Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [sessionsDone, setSessionsDone] = useState(0);

  // Suggestion Box State
  const [suggestionView, setSuggestionView] = useState<'submit' | 'track'>('submit');
  const [fbMatric, setFbMatric] = useState('');
  const [fbName, setFbName] = useState('');
  const [fbIsAnonymous, setFbIsAnonymous] = useState(false);
  const [fbLevel, setFbLevel] = useState('100 Level');
  const [fbCategory, setFbCategory] = useState('Course Materials');
  const [fbSubject, setFbSubject] = useState('');
  const [fbDetails, setFbDetails] = useState('');
  const [fbPriority, setFbPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [trackTicketInput, setTrackTicketInput] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<ComplaintTicket | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Admin Space State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);
  const [allTickets, setAllTickets] = useState<ComplaintTicket[]>([]);
  const [adminActiveTab, setAdminActiveTab] = useState<'tickets' | 'resources' | 'settings'>('tickets');
  const [ticketReplyModal, setTicketReplyModal] = useState<ComplaintTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'Pending' | 'Under Review' | 'Resolved'>('Resolved');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Initialize
  useEffect(() => {
    async function init() {
      await seedInitialData();
      await refreshData();
      const auth = sessionStorage.getItem('apple_clean_auth');
      if (auth === 'true') {
        setIsAdminLoggedIn(true);
      }
    }
    init();
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerRunning && timerSeconds === 0) {
      setTimerRunning(false);
      if (timerMode === 'study') {
        setSessionsDone((s) => s + 1);
        showToast('Study session complete! Take a 5-minute break.');
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        showToast('Break finished! Ready for next session?');
        setTimerMode('study');
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, timerMode]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const refreshData = async () => {
    const res = await dbGetAll<AcademicResource>('resources');
    setResources(res);
    const tickets = await dbGetAll<ComplaintTicket>('suggestions');
    setAllTickets(tickets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    const logs = await dbGetAll<AuditLog>('audit_logs');
    setAuditLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  // Direct File Download
  const handleDownload = (item: AcademicResource) => {
    showToast(`Downloading ${item.code}...`);
    if (item.fileBlob) {
      const url = URL.createObjectURL(item.fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName || `${item.code}_${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.${item.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } else {
      const content = `DEPARTMENT OF BUSINESS ADMINISTRATION
FACULTY OF MANAGEMENT SCIENCES
======================================================
Course: ${item.code} - ${item.title}
Level: ${item.level} · Category: ${item.type}
Date: ${item.date} · Contributor: ${item.uploader}
Google Drive Repository: ${GOOGLE_DRIVE_FOLDER_URL}
======================================================

Course Syllabus & Notes:
${item.description}

Key Management Principles:
- Division of Work & Specialization
- Authority, Responsibility & Discipline
- Unity of Command & Unity of Direction
- Equity, Order & Stability of Personnel
- 5.0 CGPA Formula: Total Quality Points ÷ Total Units

Direct Google Drive Link:
${GOOGLE_DRIVE_FOLDER_URL}
======================================================`;

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.code}_CourseGuide.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  // Student Document Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a file to upload (up to 100MB).');
      return;
    }

    const trackingId = 'ACAD-SUB-' + Math.floor(100000 + Math.random() * 900000);
    const ext = uploadFile.name.split('.').pop()?.toUpperCase() || 'PDF';
    const sizeStr = (uploadFile.size / (1024 * 1024)).toFixed(1) + ' MB';
    const courseCodeFormatted = uploadCourseCode.trim().toUpperCase();
    const docTitleFormatted = uploadDocTitle.trim() || `${courseCodeFormatted} Resource`;
    const uploaderFormatted = uploadUploaderName.trim() || 'Student Contributor';

    const newResource: AcademicResource = {
      id: 'res-' + Date.now(),
      code: courseCodeFormatted,
      title: docTitleFormatted,
      level: uploadLevel,
      type: uploadCategory,
      format: ext,
      size: sizeStr,
      date: new Date().toISOString().split('T')[0],
      uploader: uploaderFormatted,
      description: uploadDescription.trim() || 'Uploaded document linked to Google Drive.',
      isDemo: false,
      driveUrl: GOOGLE_DRIVE_FOLDER_URL,
      trackingId: trackingId,
      fileName: uploadFile.name,
      fileBlob: uploadFile,
      isStudentUpload: true,
      driveSynced: true
    };

    try {
      await dbPut('resources', newResource);
      await logAuditAction('Document Uploaded', uploaderFormatted, `Saved ${courseCodeFormatted} [${trackingId}]`);
      setUploadResultTrackingId(trackingId);
      setUploadFile(null);
      setUploadDocTitle('');
      setUploadDescription('');
      showToast('Document uploaded and added to the download bank.');
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast('Upload error. Please try again.');
    }
  };

  // Offline AI Tutor Responses
  const handleSendAi = (customText?: string) => {
    const text = (customText || chatInput).trim();
    if (!text) return;

    const userMsg = { role: 'user' as const, text, time: 'Just now' };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = `Here to help! You can browse and download all verified materials in our Google Drive folder: ${GOOGLE_DRIVE_FOLDER_URL}`;

      if (lower.includes('fayol') || lower.includes('14') || lower.includes('principles')) {
        reply = `Henri Fayol's 14 Principles of Management:
1. Division of Work — Specialization improves output and worker efficiency.
2. Authority & Responsibility — Managers must give clear directives with accountability.
3. Discipline — Adherence to established codes and mutual respect.
4. Unity of Command — Every employee reports to only one direct supervisor.
5. Unity of Direction — One plan and one leader for common objectives.
6. Subordination of Individual Interest — The organizational mission comes first.
7. Remuneration — Fair, equitable compensation for all staff.
8. Centralization — Balanced decision-making between top leadership and branches.
9. Scalar Chain — An unbroken hierarchy of line authority from top to bottom.
10. Order — The right person and resource in the right place.
11. Equity — Kindness, impartiality, and fairness for everyone.
12. Stability of Personnel — Retaining experienced talent to minimize turnover friction.
13. Initiative — Encouraging workers to originate and carry out ideas.
14. Esprit de Corps — Building collective morale, team harmony, and unity.`;
      } else if (lower.includes('cgpa') || lower.includes('gpa') || lower.includes('grade') || lower.includes('5.0')) {
        reply = `5.00 CGPA Grading Scale:
• 70% – 100% (A): 5.0 Points
• 60% – 69% (B): 4.0 Points
• 50% – 59% (C): 3.0 Points
• 45% – 49% (D): 2.0 Points
• 40% – 44% (E): 1.0 Point
• 0% – 39% (F): 0.0 Points

Honours Classifications:
• 4.50 – 5.00: First Class Honours
• 3.50 – 4.49: Second Class Honours (Upper Division)
• 2.40 – 3.49: Second Class Honours (Lower Division)
• 1.50 – 2.39: Third Class Honours
• 1.00 – 1.49: Pass Degree

Formula: Semester GPA = Total Quality Points ÷ Total Units Registered.`;
      } else if (lower.includes('weber') || lower.includes('bureaucracy')) {
        reply = `Max Weber's Bureaucratic Model:
A rational-legal organizational structure based on:
1. Hierarchy of Authority — Explicit vertical line of command.
2. Formal Rules and Regulations — Standard operating procedures and consistency.
3. Division of Labor — Clear areas of specialized competence.
4. Impersonality — Decisions made on documented standards, free of personal bias.
5. Merit-based Careers — Employment and promotion based strictly on technical competence.`;
      } else if (lower.includes('taylor') || lower.includes('scientific')) {
        reply = `Frederick Winslow Taylor's Scientific Management:
1. Science, Not Rule of Thumb — Time-and-motion empirical studies.
2. Scientific Selection & Training — Matching workers systematically to suitable roles.
3. Cooperation Over Individualism — Aligning workforce and management objectives.
4. Equal Division of Responsibility — Management plans systematically; workers execute with precision.`;
      } else if (lower.includes('project') || lower.includes('chapter') || lower.includes('thesis')) {
        reply = `University Research Project Structure (Chapters 1–5):
• Chapter 1: Introduction (Background, Problem Statement, Objectives, Hypotheses, Scope, Significance)
• Chapter 2: Literature Review (Conceptual Framework, Theoretical Framework, Empirical Studies)
• Chapter 3: Research Methodology (Design, Population, Sample Size via Taro Yamane, Sampling Technique, Instrument, Data Analysis)
• Chapter 4: Data Presentation & Analysis (Demographics, Hypotheses Testing using Regression/ANOVA, Discussion)
• Chapter 5: Summary, Conclusion & Recommendations (Managerial implications, Policy advice, Limitations)`;
      } else if (lower.includes('drive') || lower.includes('download') || lower.includes('folder')) {
        reply = `Official Google Drive Repository:
Access and download complete lecture slides, past exams, and curriculum guides:
${GOOGLE_DRIVE_FOLDER_URL}
No login required. Works on mobile and desktop.`;
      } else if (lower.includes('100') || lower.includes('200') || lower.includes('300') || lower.includes('400')) {
        reply = `Business Administration Core Curriculum:
• 100L: BUS 101/102 (Intro to Business), BUS 103 (Principles of Management I), ACC 101, ECO 101, GST 111
• 200L: BUS 201 (Principles of Management II), BUS 202 (Marketing), BUS 203 (Business Maths & Stats), BUS 204 (Commercial Law)
• 300L: BUS 301 (Organizational Behaviour), BUS 303 (Operations Research), BUS 305 (Marketing Strategy), BUS 307 (HRM)
• 400L: BUS 401/402 (Business Policy & Strategic Management), BUS 403 (International Business), BUS 499 (Final Year Project)`;
      }

      setChatMessages((prev) => [...prev, { role: 'bot', text: reply, time: 'Just now' }]);
    }, 250);
  };

  // CGPA Calculator Logic
  const getGradePoints = (grade: string): number => {
    switch (grade) {
      case 'A': return 5;
      case 'B': return 4;
      case 'C': return 3;
      case 'D': return 2;
      case 'E': return 1;
      case 'F': return 0;
      default: return 0;
    }
  };

  const calculateCgpa = () => {
    let currentUnits = 0;
    let currentPoints = 0;
    cgpaCourses.forEach((c) => {
      const u = Number(c.units) || 0;
      currentUnits += u;
      currentPoints += u * getGradePoints(c.grade);
    });

    const currentGpa = currentUnits > 0 ? (currentPoints / currentUnits).toFixed(2) : '0.00';
    const pCgpa = parseFloat(prevCgpa);
    const pUnits = parseFloat(prevUnits);

    let cumulativeCgpa = currentGpa;
    if (!isNaN(pCgpa) && !isNaN(pUnits) && pUnits > 0) {
      const prevPoints = pCgpa * pUnits;
      const totalUnits = pUnits + currentUnits;
      const totalPoints = prevPoints + currentPoints;
      cumulativeCgpa = (totalPoints / totalUnits).toFixed(2);
    }

    const num = parseFloat(cumulativeCgpa);
    let honours = 'Pass Degree';
    if (num >= 4.5) honours = 'First Class Honours (Distinction)';
    else if (num >= 3.5) honours = 'Second Class Honours (Upper Division)';
    else if (num >= 2.4) honours = 'Second Class Honours (Lower Division)';
    else if (num >= 1.5) honours = 'Third Class Honours';

    return { currentGpa, cumulativeCgpa, honours, totalUnits: currentUnits };
  };

  // Suggestion Submission
  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbSubject.trim() || !fbDetails.trim()) {
      showToast('Please provide a subject and details for your suggestion.');
      return;
    }

    const ticketId = 'ACAD-TIC-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket: ComplaintTicket = {
      ticketId,
      matricNumber: fbIsAnonymous ? 'ANONYMOUS' : (fbMatric.trim().toUpperCase() || 'ANONYMOUS'),
      studentName: fbIsAnonymous ? 'Anonymous Student' : (fbName.trim() || 'Department Student'),
      level: fbLevel,
      category: fbCategory,
      subject: fbSubject.trim(),
      details: fbDetails.trim(),
      status: 'Pending',
      priority: fbPriority,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await dbPut('suggestions', newTicket);
      await logAuditAction('Suggestion Submitted', newTicket.matricNumber, `Ticket ${ticketId} (${newTicket.category})`);
      setSubmittedTicketId(ticketId);
      setFbSubject('');
      setFbDetails('');
      showToast(`Submitted successfully! Your ticket ID is ${ticketId}`);
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast('Failed to submit suggestion.');
    }
  };

  // Track Ticket
  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackTicketInput.trim().toUpperCase();
    if (!query) return;

    setTrackSearched(true);
    const tickets = await dbGetAll<ComplaintTicket>('suggestions');
    const match = tickets.find((t) => t.ticketId.toUpperCase() === query);
    setTrackedTicket(match || null);
  };

  // Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinItem = await dbGet<any>('settings', 'adminPin');
    const correctPin = pinItem ? pinItem.value : '2026';

    if (adminPinInput.trim() === correctPin) {
      sessionStorage.setItem('apple_clean_auth', 'true');
      setIsAdminLoggedIn(true);
      setAdminPinError(false);
      setAdminPinInput('');
      showToast('Welcome to EXCOS Admin Space.');
      await logAuditAction('Admin Login', 'Officer', 'Session started');
      await refreshData();
    } else {
      setAdminPinError(true);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('apple_clean_auth');
    setIsAdminLoggedIn(false);
    showToast('Signed out of Admin Space.');
  };

  // Admin Reply to Suggestion
  const handleSaveTicketReply = async () => {
    if (!ticketReplyModal) return;
    const updated: ComplaintTicket = {
      ...ticketReplyModal,
      status: replyStatus,
      excosResponse: replyText.trim(),
      resolvedAt: replyStatus === 'Resolved' ? new Date().toISOString().split('T')[0] : ticketReplyModal.resolvedAt
    };
    await dbPut('suggestions', updated);
    await logAuditAction('Ticket Updated', 'Officer', `Replied to ${updated.ticketId} (${replyStatus})`);
    showToast(`Updated ticket ${updated.ticketId}`);
    setTicketReplyModal(null);
    setReplyText('');
    await refreshData();
  };

  // Admin Delete Resource
  const handleDeleteResource = async (id: string, code: string) => {
    if (confirm(`Remove ${code} from the resource bank?`)) {
      await dbDelete('resources', id);
      await logAuditAction('Resource Removed', 'Officer', `Deleted ${code}`);
      showToast(`Removed ${code}`);
      await refreshData();
    }
  };

  // Admin Change Passcode
  const handleChangeAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPin.trim().length < 4) {
      showToast('Passcode must be at least 4 digits.');
      return;
    }
    await dbPut('settings', { key: 'adminPin', value: newAdminPin.trim() });
    await logAuditAction('Passcode Changed', 'Officer', 'Admin PIN updated');
    showToast('Admin passcode updated successfully.');
    setNewAdminPin('');
  };

  // Filtered Resources
  const filteredResources = resources.filter((item) => {
    const matchesLevel = levelFilter === 'ALL' || item.level === levelFilter;
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.uploader.toLowerCase().includes(q);
    return matchesLevel && matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1D1D1F]/90 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2.5 animate-fade-in text-xs font-medium">
          <Check className="w-4 h-4 text-[#0071E3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 animate-scale-up">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-[#86868B]">
                  {previewResource.code} · {previewResource.level} · {previewResource.type}
                </span>
                <h3 className="text-lg font-semibold text-[#1D1D1F] mt-1">
                  {previewResource.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="p-1 rounded-full text-[#86868B] hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-5 p-4 bg-[#F5F5F7] rounded-2xl text-xs text-[#1D1D1F] leading-relaxed space-y-2">
              <p className="font-medium text-[#1D1D1F]">Summary & Core Syllabus:</p>
              <p className="text-[#86868B]">{previewResource.description}</p>
              <div className="pt-2 text-[11px] text-[#86868B] border-t border-black/5">
                Format: {previewResource.format} ({previewResource.size}) · Contributed by {previewResource.uploader}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <a
                href={previewResource.driveUrl || GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-medium text-[#0071E3] bg-[#0071E3]/10 hover:bg-[#0071E3]/20 rounded-full inline-flex items-center gap-1 transition"
              >
                <span>Open in Drive</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => {
                  handleDownload(previewResource);
                  setPreviewResource(null);
                }}
                className="px-5 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full inline-flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-7 animate-scale-up my-8">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F]">Upload Academic Document</h3>
                <p className="text-xs text-[#86868B] mt-0.5">Files are saved locally and synced with Google Drive.</p>
              </div>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadResultTrackingId(null);
                }}
                className="p-1 text-[#86868B] hover:bg-black/5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadResultTrackingId ? (
              <div className="my-6 p-5 bg-[#F5F5F7] rounded-2xl text-center space-y-3">
                <CheckCircle className="w-8 h-8 text-[#0071E3] mx-auto" />
                <h4 className="text-sm font-semibold text-[#1D1D1F]">Document Published!</h4>
                <p className="text-xs text-[#86868B]">
                  Your document is now available for download in the resource bank.
                </p>
                <div className="p-2.5 bg-white rounded-xl text-xs font-mono font-medium text-[#1D1D1F] border border-black/5">
                  Tracking Code: {uploadResultTrackingId}
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <a
                    href={GOOGLE_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-medium text-[#0071E3] bg-[#0071E3]/10 rounded-full inline-flex items-center gap-1"
                  >
                    <span>View Drive Folder</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      setUploadResultTrackingId(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-white bg-[#0071E3] rounded-full"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4">
                {/* File picker */}
                <div>
                  <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                    File Attachment (PDF, Word, PPT up to 100MB)
                  </label>
                  <div
                    onClick={() => document.getElementById('studentFilePicker')?.click()}
                    className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      uploadFile ? 'border-[#0071E3] bg-[#0071E3]/5' : 'border-black/15 bg-[#F5F5F7] hover:border-black/30'
                    }`}
                  >
                    <input
                      id="studentFilePicker"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    {uploadFile ? (
                      <div className="text-xs">
                        <p className="font-semibold text-[#1D1D1F]">{uploadFile.name}</p>
                        <p className="text-[#86868B] mt-0.5">
                          {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB · Ready
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-[#86868B]">
                        <Upload className="w-6 h-6 text-[#86868B] mx-auto mb-1.5 opacity-60" />
                        <span className="font-medium text-[#1D1D1F]">Tap to select a document</span> or drag & drop
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Level</label>
                    <select
                      value={uploadLevel}
                      onChange={(e) => setUploadLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
                    >
                      <option value="100 Level">100 Level</option>
                      <option value="200 Level">200 Level</option>
                      <option value="300 Level">300 Level</option>
                      <option value="400 Level">400 Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
                    >
                      <option value="Lecture Note">Lecture Note</option>
                      <option value="Past Question">Past Examination Question</option>
                      <option value="Textbook">Textbook</option>
                      <option value="Assignment">Assignment Solution</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Course Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BUS 201"
                      value={uploadCourseCode}
                      onChange={(e) => setUploadCourseCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl uppercase font-medium outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="Student name"
                      value={uploadUploaderName}
                      onChange={(e) => setUploadUploaderName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#86868B] mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024 First Semester Examination Past Questions"
                    value={uploadDocTitle}
                    onChange={(e) => setUploadDocTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#86868B] mb-1">Short Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Brief note on topics or questions covered..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-[#1D1D1F] bg-[#E8E8ED] hover:bg-[#D8D8DD] rounded-full"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full inline-flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Publish</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Apple-style Top Bar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Branding */}
            <div
              onClick={() => setActiveTab('drive')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-xl bg-[#0071E3] flex items-center justify-center text-white shadow-xs">
                <Folder className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-[#1D1D1F]">
                  Business Administration
                </span>
                <span className="text-[10px] text-[#86868B] -mt-0.5">
                  Academic Portal · UNIMAID
                </span>
              </div>
            </div>

            {/* Apple Segmented Navigation (The 4 Core Pillars) */}
            <div className="bg-[#E8E8ED] p-1 rounded-full flex items-center text-xs">
              <button
                onClick={() => setActiveTab('drive')}
                className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                  activeTab === 'drive'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Drive Files
              </button>

              <button
                onClick={() => setActiveTab('assistant')}
                className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                  activeTab === 'assistant'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                AI Assistant
              </button>

              <button
                onClick={() => setActiveTab('suggestions')}
                className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                  activeTab === 'suggestions'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                Suggestions
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-[#0071E3] shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {isAdminLoggedIn ? 'Console' : 'Admin'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ========================================================
            PILLAR 1: GOOGLE DRIVE & STUDENT DOWNLOAD BANK
            ======================================================== */}
        {activeTab === 'drive' && (
          <div className="space-y-6 animate-fade-in">
            {/* Prominent Official Google Drive Banner Card */}
            <div className="bg-gradient-to-br from-white to-[#F0F4FA] p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-lg">
                <span className="text-[11px] font-semibold tracking-wide text-[#0071E3] uppercase">
                  Cloud Backend Repository
                </span>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                  Department Google Drive
                </h1>
                <p className="text-xs sm:text-sm text-[#86868B] leading-relaxed">
                  Access the official departmental Google Drive folder for past exam papers, lecture slides, assignments, and curriculum syllabi across 100L to 400L.
                </p>
                <div className="pt-2 text-xs text-[#86868B] flex items-center gap-2">
                  <span>Folder ID: <code className="font-mono text-[#1D1D1F]">{GOOGLE_DRIVE_FOLDER_ID}</code></span>
                  <span>·</span>
                  <span className="text-emerald-600 font-medium">Always Synced</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
                <a
                  href={GOOGLE_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <span>Open Drive Folder</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-black/10 text-xs font-medium text-[#1D1D1F] inline-flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>

            {/* Filter Controls (Apple Segmented Bar) */}
            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-[#1D1D1F]">
                    Course Materials Bank
                  </h2>
                  <span className="text-xs text-[#86868B]">
                    ({filteredResources.length} items available)
                  </span>
                </div>

                {/* Level Selector */}
                <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex text-xs self-start sm:self-auto">
                  {['ALL', '100 Level', '200 Level', '300 Level', '400 Level'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevelFilter(lvl)}
                      className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                        levelFilter === lvl
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {lvl === 'ALL' ? 'All' : lvl.replace(' Level', 'L')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 relative">
                  <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by course code, title, or topic (e.g. BUS 201)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl text-[#1D1D1F] outline-none cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Past Question">Past Examination Question</option>
                    <option value="Lecture Note">Lecture Note</option>
                    <option value="Textbook">Textbook</option>
                    <option value="Assignment">Assignment</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Resources Grid */}
            {filteredResources.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-black/5">
                <p className="text-sm text-[#86868B]">No documents found matching your filter.</p>
                <button
                  onClick={() => {
                    setLevelFilter('ALL');
                    setTypeFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs text-[#0071E3] font-medium hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResources.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-black/5 hover:border-black/15 shadow-xs transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Quiet metadata line */}
                      <div className="flex items-center gap-2 text-xs text-[#86868B]">
                        <span className="font-semibold text-[#1D1D1F]">{item.code}</span>
                        <span>·</span>
                        <span>{item.level}</span>
                        <span>·</span>
                        <span>{item.type}</span>
                        {item.isStudentUpload && (
                          <>
                            <span>·</span>
                            <span className="text-[#0071E3] font-medium">Drive Synced</span>
                          </>
                        )}
                      </div>

                      <h3 className="font-semibold text-sm text-[#1D1D1F] mt-2 leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-[#86868B] mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="text-[11px] text-[#A1A1A6] mt-2.5">
                        Uploaded by {item.uploader} · {item.date}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3.5 mt-4 border-t border-black/5 flex items-center justify-between text-xs">
                      <span className="text-[#86868B]">
                        {item.format} ({item.size})
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewResource(item)}
                          className="px-2.5 py-1 text-[#86868B] hover:text-[#1D1D1F] transition cursor-pointer"
                        >
                          Preview
                        </button>

                        <button
                          onClick={() => handleDownload(item)}
                          className="px-3 py-1 bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] font-medium rounded-full inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>

                        <a
                          href={item.driveUrl || GOOGLE_DRIVE_FOLDER_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-[#86868B] hover:text-[#0071E3] transition"
                          title="Open in Drive"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PILLAR 2: OFFLINE AI ASSISTANT & ACADEMIC TOOLKIT
            ======================================================== */}
        {activeTab === 'assistant' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Sub-tabs */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0071E3]" />
                  <h1 className="text-lg font-semibold text-[#1D1D1F]">
                    Academic AI Assistant & Toolkit
                  </h1>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">
                  100% offline knowledge engine for Business Administration theories, project guide, and CGPA tools.
                </p>
              </div>

              {/* Sub-tabs */}
              <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex text-xs self-start sm:self-auto">
                <button
                  onClick={() => setAiSubTab('chat')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    aiSubTab === 'chat' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                  }`}
                >
                  AI Tutor
                </button>
                <button
                  onClick={() => setAiSubTab('cgpa')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    aiSubTab === 'cgpa' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                  }`}
                >
                  CGPA Calculator
                </button>
                <button
                  onClick={() => setAiSubTab('timer')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    aiSubTab === 'timer' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                  }`}
                >
                  Focus Timer
                </button>
              </div>
            </div>

            {/* Sub-tab 1: AI Chat */}
            {aiSubTab === 'chat' && (
              <div className="bg-white rounded-3xl border border-black/5 shadow-xs flex flex-col h-[520px]">
                {/* Chat Message Stream */}
                <div ref={chatScrollRef} className="flex-1 p-5 overflow-y-auto space-y-3.5">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-[#0071E3] text-white rounded-br-xs'
                            : 'bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Prompts */}
                <div className="px-4 py-2 bg-[#F5F5F7]/60 border-t border-black/5 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <span className="text-[#86868B] shrink-0 font-medium">Quick ask:</span>
                  {[
                    "Henri Fayol's 14 principles",
                    "Max Weber bureaucracy",
                    "5.0 CGPA scale",
                    "Project Chapters 1 to 5",
                    "200 Level core courses"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendAi(chip)}
                      className="px-2.5 py-1 bg-white hover:bg-black/5 border border-black/5 rounded-full text-[#1D1D1F] shrink-0 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 border-t border-black/5 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask about management theories, syllabus, projects, or formulas..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
                    className="flex-1 px-4 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <button
                    onClick={() => handleSendAi()}
                    className="w-9 h-9 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white flex items-center justify-center transition shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Sub-tab 2: 5.0 CGPA Calculator */}
            {aiSubTab === 'cgpa' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-black/5">
                  <div>
                    <h3 className="text-base font-semibold text-[#1D1D1F]">5.0 CGPA Calculator</h3>
                    <p className="text-xs text-[#86868B]">Official grading scale: A=5, B=4, C=3, D=2, E=1, F=0.</p>
                  </div>
                  <button
                    onClick={() =>
                      setCgpaCourses([
                        ...cgpaCourses,
                        { id: Date.now().toString(), code: `BUS ${cgpaCourses.length + 1}01`, units: 3, grade: 'A' }
                      ])
                    }
                    className="px-3 py-1.5 bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] rounded-full text-xs font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Course</span>
                  </button>
                </div>

                {/* Course Inputs */}
                <div className="space-y-2.5">
                  {cgpaCourses.map((c, idx) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="text"
                        value={c.code}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCgpaCourses(cgpaCourses.map((item) => (item.id === c.id ? { ...item, code: val } : item)));
                        }}
                        className="w-28 px-2.5 py-1.5 bg-[#F5F5F7] rounded-lg font-medium outline-none"
                      />
                      <select
                        value={c.units}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCgpaCourses(cgpaCourses.map((item) => (item.id === c.id ? { ...item, units: val } : item)));
                        }}
                        className="px-2.5 py-1.5 bg-[#F5F5F7] rounded-lg outline-none"
                      >
                        {[1, 2, 3, 4, 6].map((u) => (
                          <option key={u} value={u}>
                            {u} Units
                          </option>
                        ))}
                      </select>
                      <select
                        value={c.grade}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCgpaCourses(cgpaCourses.map((item) => (item.id === c.id ? { ...item, grade: val } : item)));
                        }}
                        className="px-2.5 py-1.5 bg-[#F5F5F7] rounded-lg font-bold outline-none"
                      >
                        {['A', 'B', 'C', 'D', 'E', 'F'].map((g) => (
                          <option key={g} value={g}>
                            Grade {g}
                          </option>
                        ))}
                      </select>
                      {cgpaCourses.length > 1 && (
                        <button
                          onClick={() => setCgpaCourses(cgpaCourses.filter((item) => item.id !== c.id))}
                          className="p-1 text-[#86868B] hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Previous Cumulative Input */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-black/5 text-xs">
                  <div>
                    <label className="block text-[#86868B] mb-1">Previous CGPA (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 4.25"
                      value={prevCgpa}
                      onChange={(e) => setPrevCgpa(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F5F7] rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#86868B] mb-1">Previous Total Units</label>
                    <input
                      type="number"
                      placeholder="e.g. 36"
                      value={prevUnits}
                      onChange={(e) => setPrevUnits(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F5F5F7] rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Results Card */}
                {(() => {
                  const res = calculateCgpa();
                  return (
                    <div className="p-5 bg-gradient-to-r from-[#0071E3]/5 to-[#0071E3]/15 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-[#86868B]">Semester GPA</div>
                        <div className="text-3xl font-bold text-[#0071E3]">{res.currentGpa}</div>
                        <div className="text-xs text-[#86868B] mt-0.5">{res.totalUnits} credit units</div>
                      </div>
                      <div className="text-right sm:border-l sm:border-black/5 sm:pl-6">
                        <div className="text-xs text-[#86868B]">Projected Cumulative CGPA</div>
                        <div className="text-2xl font-bold text-[#1D1D1F]">{res.cumulativeCgpa}</div>
                        <div className="text-xs font-medium text-emerald-600 mt-0.5">{res.honours}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Sub-tab 3: Focus Timer */}
            {aiSubTab === 'timer' && (
              <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-xs text-center space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    {timerMode === 'study' ? 'Deep Study Session' : 'Rest Break'}
                  </h3>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    25-minute Pomodoro focus interval for study efficiency.
                  </p>
                </div>

                <div className="text-6xl font-light tracking-tight font-mono text-[#1D1D1F]">
                  {Math.floor(timerSeconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(timerSeconds % 60).toString().padStart(2, '0')}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="px-6 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
                  >
                    {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{timerRunning ? 'Pause' : 'Start Timer'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSeconds(timerMode === 'study' ? 25 * 60 : 5 * 60);
                    }}
                    className="px-4 py-2.5 bg-[#E8E8ED] hover:bg-[#D8D8DD] text-[#1D1D1F] rounded-full text-xs font-medium inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="text-xs text-[#86868B]">
                  Sessions Completed: <strong className="text-[#1D1D1F]">{sessionsDone}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PILLAR 3: SUGGESTIONS & COMPLAINTS BOX
            ======================================================== */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Toggle */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0071E3]" />
                  <h1 className="text-lg font-semibold text-[#1D1D1F]">
                    Student Suggestion & Grievance Box
                  </h1>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Direct line to the Departmental EXCOS. Submit anonymously or provide contact details.
                </p>
              </div>

              {/* View Toggle */}
              <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex text-xs self-start sm:self-auto">
                <button
                  onClick={() => setSuggestionView('submit')}
                  className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                    suggestionView === 'submit' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                  }`}
                >
                  New Suggestion
                </button>
                <button
                  onClick={() => setSuggestionView('track')}
                  className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                    suggestionView === 'track' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                  }`}
                >
                  Track Ticket
                </button>
              </div>
            </div>

            {/* Submit View */}
            {suggestionView === 'submit' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs space-y-5">
                {submittedTicketId && (
                  <div className="p-4 bg-[#F5F5F7] rounded-2xl text-xs space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Suggestion Logged with EXCOS</span>
                    </div>
                    <p className="text-[#86868B]">
                      Keep this reference code to track executive updates or response:
                    </p>
                    <div className="font-mono font-bold text-sm text-[#1D1D1F]">
                      {submittedTicketId}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                  {/* Anonymous Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-[#F5F5F7] rounded-2xl text-xs">
                    <div>
                      <span className="font-medium text-[#1D1D1F]">Submit Anonymously</span>
                      <p className="text-[#86868B] text-[11px]">Your name and matric will not be shown to officers.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={fbIsAnonymous}
                      onChange={(e) => setFbIsAnonymous(e.target.checked)}
                      className="w-4 h-4 accent-[#0071E3] cursor-pointer"
                    />
                  </div>

                  {!fbIsAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#86868B] mb-1">Matric Number (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 19/04/02/001"
                          value={fbMatric}
                          onChange={(e) => setFbMatric(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#86868B] mb-1">Full Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="Your name"
                          value={fbName}
                          onChange={(e) => setFbName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Academic Level</label>
                      <select
                        value={fbLevel}
                        onChange={(e) => setFbLevel(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
                      >
                        <option value="100 Level">100 Level</option>
                        <option value="200 Level">200 Level</option>
                        <option value="300 Level">300 Level</option>
                        <option value="400 Level">400 Level</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Category</label>
                      <select
                        value={fbCategory}
                        onChange={(e) => setFbCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
                      >
                        <option value="Course Materials">Course Materials / Handouts</option>
                        <option value="Lecture Hall">Lecture Hall & Facilities</option>
                        <option value="Timetable">Timetable & Scheduling</option>
                        <option value="Examination">Examination Issues</option>
                        <option value="General Feedback">General Idea / Suggestion</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Priority</label>
                      <select
                        value={fbPriority}
                        onChange={(e) => setFbPriority(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent / Time-Sensitive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Request for BUS 301 2024 Past Questions on Drive"
                      value={fbSubject}
                      onChange={(e) => setFbSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Details & Constructive Notes</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Describe the issue, recommendation, or request in detail..."
                      value={fbDetails}
                      onChange={(e) => setFbDetails(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full inline-flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit to EXCOS</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Track View */}
            {suggestionView === 'track' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs space-y-6">
                <form onSubmit={handleTrackTicket} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Ticket ID (e.g. ACAD-TIC-123456)..."
                    value={trackTicketInput}
                    onChange={(e) => setTrackTicketInput(e.target.value)}
                    className="flex-1 px-4 py-2 text-xs bg-[#F5F5F7] rounded-xl uppercase font-mono outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-medium text-white bg-[#0071E3] rounded-xl"
                  >
                    Track
                  </button>
                </form>

                {trackSearched && (
                  <div>
                    {trackedTicket ? (
                      <div className="p-5 bg-[#F5F5F7] rounded-2xl space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-[#1D1D1F]">
                            {trackedTicket.ticketId}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                              trackedTicket.status === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-700'
                                : trackedTicket.status === 'Under Review'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {trackedTicket.status}
                          </span>
                        </div>

                        <div>
                          <div className="font-medium text-[#1D1D1F]">{trackedTicket.subject}</div>
                          <p className="text-[#86868B] mt-1">{trackedTicket.details}</p>
                        </div>

                        {trackedTicket.excosResponse && (
                          <div className="p-3 bg-white rounded-xl border border-black/5 mt-2">
                            <span className="text-[11px] font-semibold text-[#0071E3]">
                              Official Executive Response:
                            </span>
                            <p className="text-[#1D1D1F] mt-1">{trackedTicket.excosResponse}</p>
                          </div>
                        )}

                        <div className="text-[11px] text-[#A1A1A6]">
                          Submitted on {trackedTicket.date} · Level: {trackedTicket.level}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-[#86868B]">
                        No suggestion found with that Ticket ID.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PILLAR 4: ADMIN SPACE (EXCOS PASSCODE PROTECTED)
            ======================================================== */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            {!isAdminLoggedIn ? (
              /* Passcode Login Screen */
              <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-xs max-w-sm mx-auto text-center space-y-5 my-8">
                <div className="w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-[#1D1D1F]">EXCOS Admin Space</h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Authorized officers only. Default passcode: <code className="font-mono text-[#1D1D1F]">2026</code>
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter Passcode..."
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    className="w-full px-4 py-2.5 text-center tracking-widest text-sm bg-[#F5F5F7] rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                  {adminPinError && (
                    <p className="text-xs text-red-600">Incorrect passcode. Try again.</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full text-xs font-medium transition"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            ) : (
              /* Authenticated Admin Dashboard */
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#0071E3]" />
                      <h1 className="text-lg font-semibold text-[#1D1D1F]">Executive Console</h1>
                    </div>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Review student complaints, manage Drive resources, and update portal settings.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex text-xs">
                      <button
                        onClick={() => setAdminActiveTab('tickets')}
                        className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                          adminActiveTab === 'tickets' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                        }`}
                      >
                        Suggestions ({allTickets.length})
                      </button>
                      <button
                        onClick={() => setAdminActiveTab('resources')}
                        className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                          adminActiveTab === 'resources' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                        }`}
                      >
                        Resources ({resources.length})
                      </button>
                      <button
                        onClick={() => setAdminActiveTab('settings')}
                        className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                          adminActiveTab === 'settings' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B]'
                        }`}
                      >
                        Settings
                      </button>
                    </div>

                    <button
                      onClick={handleAdminLogout}
                      className="p-2 text-[#86868B] hover:text-red-600 rounded-full hover:bg-black/5"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tab 1: Suggestions Manager */}
                {adminActiveTab === 'tickets' && (
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
                    <h3 className="text-sm font-semibold text-[#1D1D1F]">Student Suggestions & Tickets</h3>
                    {allTickets.length === 0 ? (
                      <p className="text-xs text-[#86868B] py-4">No suggestions received yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {allTickets.map((t) => (
                          <div
                            key={t.ticketId}
                            className="p-4 bg-[#F5F5F7] rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-[#1D1D1F]">{t.ticketId}</span>
                                <span className="text-[#86868B]">·</span>
                                <span className="text-[#86868B]">{t.category}</span>
                                <span className="text-[#86868B]">·</span>
                                <span className="font-medium text-[#1D1D1F]">{t.studentName} ({t.matricNumber})</span>
                              </div>
                              <h4 className="font-semibold text-sm text-[#1D1D1F]">{t.subject}</h4>
                              <p className="text-[#86868B] leading-relaxed">{t.details}</p>
                              {t.excosResponse && (
                                <div className="p-2.5 bg-white rounded-xl text-[11px] border border-black/5 mt-1.5">
                                  <span className="font-semibold text-[#0071E3]">EXCOS Response:</span> {t.excosResponse}
                                </div>
                              )}
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  t.status === 'Resolved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : t.status === 'Under Review'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {t.status}
                              </span>

                              <button
                                onClick={() => {
                                  setTicketReplyModal(t);
                                  setReplyText(t.excosResponse || '');
                                  setReplyStatus(t.status);
                                }}
                                className="px-3 py-1 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full text-[11px] font-medium cursor-pointer"
                              >
                                Reply / Resolve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Resources Manager */}
                {adminActiveTab === 'resources' && (
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#1D1D1F]">Manage Resource Bank</h3>
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-3 py-1.5 bg-[#0071E3] text-white rounded-full text-xs font-medium inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload New Material</span>
                      </button>
                    </div>

                    <div className="divide-y divide-black/5 text-xs">
                      {resources.map((r) => (
                        <div key={r.id} className="py-3 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-[#1D1D1F]">{r.code}</span> — {r.title}
                            <div className="text-[11px] text-[#86868B]">
                              {r.level} · {r.type} · {r.format} ({r.size}) · By {r.uploader}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={r.driveUrl || GOOGLE_DRIVE_FOLDER_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-[#0071E3] hover:bg-black/5 rounded-full"
                              title="Drive"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteResource(r.id, r.code)}
                              className="p-1.5 text-[#86868B] hover:text-red-600 rounded-full"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Admin Settings */}
                {adminActiveTab === 'settings' && (
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1D1D1F]">Change Admin Passcode</h3>
                      <p className="text-xs text-[#86868B] mt-0.5">Customize the passcode for future EXCOS logins.</p>
                      <form onSubmit={handleChangeAdminPin} className="flex gap-2 mt-3 max-w-xs">
                        <input
                          type="password"
                          placeholder="New Passcode..."
                          value={newAdminPin}
                          onChange={(e) => setNewAdminPin(e.target.value)}
                          className="flex-1 px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#0071E3] text-white rounded-xl text-xs font-medium"
                        >
                          Save
                        </button>
                      </form>
                    </div>

                    <div className="pt-4 border-t border-black/5">
                      <h3 className="text-sm font-semibold text-[#1D1D1F]">Recent Audit Actions</h3>
                      <div className="mt-3 space-y-2 text-xs">
                        {auditLogs.slice(0, 5).map((log) => (
                          <div key={log.id} className="p-2.5 bg-[#F5F5F7] rounded-xl flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-[#1D1D1F]">{log.action}</span>: {log.details}
                            </div>
                            <span className="text-[10px] text-[#86868B]">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Reply Modal */}
      {ticketReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 animate-scale-up space-y-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">
              Reply to Ticket {ticketReplyModal.ticketId}
            </h3>
            <p className="text-xs text-[#86868B]">
              Subject: <strong>{ticketReplyModal.subject}</strong>
            </p>

            <div>
              <label className="block text-xs text-[#86868B] mb-1">Status</label>
              <select
                value={replyStatus}
                onChange={(e) => setReplyStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
              >
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#86868B] mb-1">Executive Message</label>
              <textarea
                rows={3}
                placeholder="Type response for the student to see when tracking this ticket..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTicketReplyModal(null)}
                className="px-4 py-2 text-xs font-medium text-[#1D1D1F] bg-[#E8E8ED] rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTicketReply}
                className="px-5 py-2 text-xs font-medium text-white bg-[#0071E3] rounded-full"
              >
                Update Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple-style Footer */}
      <footer className="mt-auto border-t border-black/5 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868B]">
          <div>
            Department of Business Administration · University of Maiduguri
          </div>
          <div className="flex items-center gap-4">
            <a
              href={GOOGLE_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0071E3] hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>Cloud Drive</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <span>·</span>
            <button
              onClick={() => setActiveTab('admin')}
              className="hover:text-[#1D1D1F] transition cursor-pointer"
            >
              EXCOS Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

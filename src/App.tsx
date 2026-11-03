import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  ArrowUpRight,
  Upload,
  Sparkles,
  Search,
  Check,
  CheckCircle,
  Eye,
  Download,
  Flag,
  MessageSquare,
  Users,
  Shield,
  Trash2,
  RotateCcw,
  Plus,
  Calculator,
  Timer,
  Play,
  Pause,
  Lightbulb,
  Copy,
  LogOut,
  Key,
  X,
  FileText,
  Clock,
  ChevronRight,
  Menu
} from 'lucide-react';
import {
  AcademicResource,
  PendingUpload,
  ComplaintTicket,
  Leader,
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
  INITIAL_RESOURCES,
  INITIAL_LEADERSHIP
} from './storage';

export default function App() {
  // Navigation & UI State
  const [activeSection, setActiveSection] = useState<'resources' | 'upload' | 'assistant' | 'suggestions' | 'leadership' | 'admin'>('resources');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Resources state
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'VERIFIED' | 'STUDENT_UPLOADS'>('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [courseChipFilter, setCourseChipFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewResource, setPreviewResource] = useState<AcademicResource | null>(null);
  const [reportModalResource, setReportModalResource] = useState<AcademicResource | null>(null);
  const [reportReason, setReportReason] = useState('Outdated Content');
  const [reportNotes, setReportNotes] = useState('');

  // Student Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLevel, setUploadLevel] = useState('100 Level');
  const [uploadCategory, setUploadCategory] = useState('Lecture Note');
  const [uploadCourseCode, setUploadCourseCode] = useState('BUS 101');
  const [uploadCourseTitle, setUploadCourseTitle] = useState('');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadUploaderName, setUploadUploaderName] = useState('');
  const [uploadContact, setUploadContact] = useState('');
  const [uploadResultTrackingId, setUploadResultTrackingId] = useState<string | null>(null);
  const [uploadTab, setUploadTab] = useState<'submit' | 'live_uploads' | 'track'>('submit');
  const [trackSearchId, setTrackSearchId] = useState('');
  const [trackedUpload, setTrackedUpload] = useState<PendingUpload | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // AI Assistant & Academic Toolkit Tabs
  const [aiTab, setAiTab] = useState<'tutor' | 'cgpa' | 'timer' | 'research'>('tutor');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'bot'; text: string; time?: string }>>([
    {
      role: 'bot',
      text: "Hello. I am your academic assistant for the Department of Business Administration. Ask me about Henri Fayol's 14 principles of management, Max Weber's bureaucratic model, the 5.0 CGPA scale, final year project frameworks (Chapters 1 through 5), or how to access materials on Google Drive.",
      time: 'Just now'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // CGPA Calculator state
  const [cgpaCourses, setCgpaCourses] = useState<Array<{ id: string; code: string; units: number; grade: string }>>([
    { id: '1', code: 'BUS 101', units: 3, grade: 'A' },
    { id: '2', code: 'BUS 103', units: 3, grade: 'B' },
    { id: '3', code: 'ACC 101', units: 3, grade: 'A' },
    { id: '4', code: 'ECO 101', units: 3, grade: 'B' },
    { id: '5', code: 'GST 111', units: 2, grade: 'A' }
  ]);
  const [prevCgpa, setPrevCgpa] = useState<string>('');
  const [prevUnits, setPrevUnits] = useState<string>('');

  // Study Focus Timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [studySessionsCompleted, setStudySessionsCompleted] = useState(0);

  // Research Topic Generator state
  const [projectArea, setProjectArea] = useState('General Management');
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);

  // Complaints / Suggestions state
  const [feedbackTab, setFeedbackTab] = useState<'submit' | 'track'>('submit');
  const [fbMatric, setFbMatric] = useState('');
  const [fbName, setFbName] = useState('');
  const [fbLevel, setFbLevel] = useState('100 Level');
  const [fbCategory, setFbCategory] = useState('Course Materials');
  const [fbSubject, setFbSubject] = useState('');
  const [fbDetails, setFbDetails] = useState('');
  const [fbPriority, setFbPriority] = useState<'Normal' | 'Urgent'>('Normal');
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [trackTicketInput, setTrackTicketInput] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<ComplaintTicket | null>(null);
  const [trackTicketSearched, setTrackTicketSearched] = useState(false);

  // Leadership state
  const [leadership, setLeadership] = useState<Leader[]>(INITIAL_LEADERSHIP);

  // EXCOS Admin state
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState<'pending' | 'resources' | 'recycle' | 'tickets' | 'leadership' | 'pin' | 'audit'>('pending');
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [recycledResources, setRecycledResources] = useState<AcademicResource[]>([]);
  const [allTickets, setAllTickets] = useState<ComplaintTicket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Dialog Modals (Replacing blocking prompt() and confirm())
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    label: string;
    initialValue?: string;
    placeholder?: string;
    onSubmit: (val: string) => void;
  }>({ isOpen: false, title: '', label: '', onSubmit: () => {} });

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      await seedInitialData();
      await refreshAllData();
      const auth = sessionStorage.getItem('apple_clean_auth');
      if (auth === 'true') {
        setIsAdminLoggedIn(true);
      }
    }
    init();
  }, []);

  // Timer tick
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerRunning && timerSeconds === 0) {
      setTimerRunning(false);
      if (timerMode === 'study') {
        setStudySessionsCompleted((prev) => prev + 1);
        showToast('Study session complete. Time for a five-minute break.');
        setTimerMode('break');
        setTimerSeconds(5 * 60);
      } else {
        showToast('Break complete. Ready for another focus session?');
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

  const refreshAllData = async () => {
    const res = await dbGetAll<AcademicResource>('resources');
    setResources(res);
    const pending = await dbGetAll<PendingUpload>('pending_uploads');
    setPendingUploads(pending);
    const recycled = await dbGetAll<AcademicResource>('recycled_resources');
    setRecycledResources(recycled);
    const tickets = await dbGetAll<ComplaintTicket>('suggestions');
    setAllTickets(tickets);
    const leaders = await dbGetAll<Leader>('leadership');
    if (leaders.length > 0) setLeadership(leaders);
    const logs = await dbGetAll<AuditLog>('audit_logs');
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAuditLogs(logs);
  };

  // Filtered resources
  const filteredResources = resources.filter((item) => {
    if (sourceFilter === 'VERIFIED' && item.isStudentUpload) return false;
    if (sourceFilter === 'STUDENT_UPLOADS' && !item.isStudentUpload) return false;

    const matchesLevel = levelFilter === 'ALL' || item.level === levelFilter;
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    const matchesChip = courseChipFilter === 'ALL' || item.code.toUpperCase().includes(courseChipFilter.toUpperCase());
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.uploader.toLowerCase().includes(q);
    return matchesLevel && matchesType && matchesChip && matchesSearch;
  });

  const recentStudentUploads = resources.filter((r) => r.isStudentUpload);

  // Download generator
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
      const syllabusContent = `DEPARTMENT OF BUSINESS ADMINISTRATION
FACULTY OF MANAGEMENT SCIENCES
======================================================
Course: ${item.code} - ${item.title}
Level: ${item.level} · Category: ${item.type}
Date: ${item.date} · Contributor: ${item.uploader}
Google Drive Repository: ${item.driveUrl || GOOGLE_DRIVE_FOLDER_URL}
======================================================

Course Summary:
${item.description}

Core Topics & Frameworks:
1. Henri Fayol's 14 Principles of Management:
   - Division of Work: Specialization builds efficiency.
   - Authority & Responsibility: Clear command with accountable outcomes.
   - Discipline: Adherence to agreed organizational codes.
   - Unity of Command: Each team member reports to one supervisor.
   - Unity of Direction: A single coordinated plan for team goals.
   - Subordination of Individual Interest: Organization comes first.
   - Remuneration: Fair and equitable compensation.
   - Centralization vs Decentralization: Balanced decision-making.
   - Scalar Chain: Unbroken hierarchy from leadership to operations.
   - Order: The right place for every resource and person.
   - Equity: Kindness, fairness, and impartial justice.
   - Stability of Personnel: Low turnover ensures consistency.
   - Initiative: Encouraging constructive innovation.
   - Esprit de Corps: Morale and cohesion as collective strength.

2. Max Weber's Bureaucracy:
   - Formal rules, jurisdictional authority, impersonality, and merit-based career structure.

3. 5.0 CGPA Formula:
   - Semester GPA = Total Quality Points ÷ Total Credit Units
   - A=5.0 (70-100%), B=4.0 (60-69%), C=3.0 (50-59%), D=2.0 (45-49%), E=1.0 (40-44%), F=0.0 (0-39%).

Cloud Backend:
Access all slide archives, lecture notes, and past examination papers directly in Google Drive:
${GOOGLE_DRIVE_FOLDER_URL}
======================================================`;

      const blob = new Blob([syllabusContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.code}_Overview.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  // Student upload submit
  const handleStudentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a file to upload (up to 100MB).');
      return;
    }

    const trackingId = 'ACAD-SUB-' + Math.floor(100000 + Math.random() * 900000);
    const ext = uploadFile.name.split('.').pop()?.toUpperCase() || 'PDF';
    const sizeStr = (uploadFile.size / (1024 * 1024)).toFixed(1) + ' MB';
    const courseCodeFormatted = uploadCourseCode.trim().toUpperCase();
    const docTitleFormatted = uploadDocTitle.trim() || `${courseCodeFormatted} Material`;
    const uploaderFormatted = uploadUploaderName.trim() || 'Student Contributor';

    const newPending: PendingUpload = {
      trackingId,
      id: 'res-up-' + Date.now(),
      code: courseCodeFormatted,
      title: docTitleFormatted,
      courseTitle: uploadCourseTitle.trim() || courseCodeFormatted,
      level: uploadLevel,
      type: uploadCategory,
      format: ext,
      size: sizeStr,
      date: new Date().toISOString().split('T')[0],
      uploader: uploaderFormatted,
      uploaderContact: uploadContact.trim(),
      description: uploadDescription.trim() || 'Uploaded resource saved and synced with Google Drive.',
      fileName: uploadFile.name,
      fileBlob: uploadFile,
      status: 'approved',
      submittedAt: new Date().toISOString()
    };

    const newActiveResource: AcademicResource = {
      id: 'res-student-' + Date.now(),
      code: courseCodeFormatted,
      title: docTitleFormatted,
      level: uploadLevel,
      type: uploadCategory,
      format: ext,
      size: sizeStr,
      date: new Date().toISOString().split('T')[0],
      uploader: `${uploaderFormatted} (Student)`,
      description: uploadDescription.trim() || 'Student-contributed document saved and linked to Google Drive.',
      isDemo: false,
      driveUrl: GOOGLE_DRIVE_FOLDER_URL,
      trackingId: trackingId,
      fileName: uploadFile.name,
      fileBlob: uploadFile,
      isStudentUpload: true,
      driveSynced: true
    };

    try {
      await dbPut('pending_uploads', newPending);
      await dbPut('resources', newActiveResource);
      await logAuditAction(
        'Document Uploaded',
        uploaderFormatted,
        `Added ${courseCodeFormatted} (${docTitleFormatted}) · Synced with Drive [${trackingId}]`
      );

      setUploadResultTrackingId(trackingId);
      setUploadFile(null);
      setUploadDocTitle('');
      setUploadCourseTitle('');
      setUploadDescription('');
      showToast('Document saved and published to the Resource Bank.');
      await refreshAllData();
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Unable to complete upload. Please try again.');
    }
  };

  // Search submission tracking ID
  const handleSearchTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackSearchId.trim().toUpperCase();
    if (!query) return;

    setTrackSearched(true);
    const pendingList = await dbGetAll<PendingUpload>('pending_uploads');
    const match = pendingList.find((p) => p.trackingId.toUpperCase() === query);

    if (match) {
      setTrackedUpload(match);
    } else {
      const allRes = await dbGetAll<AcademicResource>('resources');
      const approved = allRes.find((r) => r.trackingId?.toUpperCase() === query);
      if (approved) {
        setTrackedUpload({
          trackingId: approved.trackingId || query,
          id: approved.id,
          code: approved.code,
          title: approved.title,
          courseTitle: approved.code,
          level: approved.level,
          type: approved.type,
          format: approved.format,
          size: approved.size,
          date: approved.date,
          uploader: approved.uploader,
          description: approved.description,
          fileName: approved.title,
          status: 'approved',
          submittedAt: approved.date
        });
      } else {
        setTrackedUpload(null);
      }
    }
  };

  // Comprehensive Offline AI Tutor Engine
  const handleSendAi = (customText?: string) => {
    const text = (customText || chatInput).trim();
    if (!text) return;

    const userMsg = { role: 'user' as const, text, time: 'Just now' };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply = "I am ready to help. You can find all course documents, syllabus guides, and past exams in our official Google Drive repository: " + GOOGLE_DRIVE_FOLDER_URL;

      if (lower.includes('fayol') || lower.includes('14') || lower.includes('principles') || lower.includes('classical')) {
        reply = `Henri Fayol's 14 Principles of Management (BUS 103 / BUS 201):

1. Division of Work — Specialization improves output by making employees more efficient.
2. Authority & Responsibility — Managers must be able to give orders, paired with accountability.
3. Discipline — Adherence to established agreements and respect for organizational rules.
4. Unity of Command — Every employee reports to only one direct supervisor.
5. Unity of Direction — One leader and one coordinated plan for activities sharing the same objective.
6. Subordination of Individual Interest — The interests of the organization take precedence over personal interests.
7. Remuneration — Fair and equitable compensation for all team members.
8. Centralization — Determining the ideal balance between centralized authority and departmental delegation.
9. Scalar Chain — A clear hierarchy of line authority from top executive ranks down to the frontline.
10. Order — The right person and material in the right place at the right time.
11. Equity — Impartiality, kindness, and justice across all levels.
12. Stability of Personnel — Retaining experienced team members to minimize the friction of high turnover.
13. Initiative — Empowering personnel to originate and execute ideas.
14. Esprit de Corps — Building team harmony and trust as a primary organizational strength.`;
      } else if (lower.includes('cgpa') || lower.includes('gpa') || lower.includes('grade') || lower.includes('grading') || lower.includes('5.0')) {
        reply = `5.00 CGPA Grading Scale & Degree Honours:

Grade Scale:
• 70% – 100% (A): 5.0 Points
• 60% – 69% (B): 4.0 Points
• 50% – 59% (C): 3.0 Points
• 45% – 49% (D): 2.0 Points
• 40% – 44% (E): 1.0 Point
• 0% – 39% (F): 0.0 Points

Honours Classification:
• 4.50 – 5.00: First Class Honours (Distinction)
• 3.50 – 4.49: Second Class Honours (Upper Division)
• 2.40 – 3.49: Second Class Honours (Lower Division)
• 1.50 – 2.39: Third Class Honours
• 1.00 – 1.49: Pass Degree

Formula: Semester GPA = Total Quality Points ÷ Total Registered Units.`;
      } else if (lower.includes('weber') || lower.includes('bureaucracy')) {
        reply = `Max Weber's Bureaucracy:
A rational-legal structure based on five foundational characteristics:
1. Hierarchy of Authority — Lower offices report directly to higher offices in an unbroken line.
2. Formal Rules & Regulations — Clear, documented operating procedures.
3. Division of Labor — Clear areas of competence for each official.
4. Impersonality — Decisions made based on documented standards without personal bias.
5. Merit-based Career Structure — Recruitment and advancement based solely on technical qualification.`;
      } else if (lower.includes('taylor') || lower.includes('scientific management')) {
        reply = `Frederick Winslow Taylor's Scientific Management (1911):
A systematic approach to operational efficiency:
1. Science, Not Rule of Thumb — Replacing guesswork with empirical time and motion study.
2. Scientific Selection & Training — Matching workers systematically to specific tasks.
3. Management-Worker Cooperation — Aligning incentives to ensure operations follow scientific guidelines.
4. Equal Division of Work — Management plans and designs; frontline teams execute with precision.`;
      } else if (lower.includes('project') || lower.includes('chapter') || lower.includes('thesis') || lower.includes('research')) {
        reply = `University Final Year Research Project Structure:

• Chapter 1: Introduction
  Background of the Study, Problem Statement, Objectives, Research Questions, Hypotheses, Significance, Scope, and Operational Definitions.

• Chapter 2: Literature Review
  Conceptual Review, Theoretical Framework, Empirical Review, and Synthesis of Knowledge Gaps.

• Chapter 3: Research Methodology
  Design, Population, Sample Size (Taro Yamane formula), Sampling Technique, Research Instrument, Validity & Reliability, and Data Analysis Method.

• Chapter 4: Data Presentation & Analysis
  Response rates, Demographic presentation, Hypotheses testing (Regression/ANOVA), and Interpretation of Findings.

• Chapter 5: Summary, Conclusions & Recommendations
  Summary of findings, Theoretical & Managerial Implications, Recommendations, and Areas for Further Study.`;
      } else if (lower.includes('drive') || lower.includes('backend') || lower.includes('cloud') || lower.includes('folder')) {
        reply = `Official Google Drive Repository:
Access the complete departmental repository of past exam papers, lecture notes, and slide decks:
${GOOGLE_DRIVE_FOLDER_URL}
Accessible across iOS, macOS, Android, and Windows with no account sign-in required.`;
      } else if (lower.includes('100') || lower.includes('freshman')) {
        reply = `100 Level Core Courses:
• BUS 101: Introduction to Business I
• BUS 102: Introduction to Business II
• BUS 103: Principles of Management I
• ACC 101 & 102: Principles of Accounting
• ECO 101 & 102: Principles of Economics
• GST 111 & 112: Communication in English
• GST 113: Nigerian Peoples and Culture`;
      } else if (lower.includes('200') || lower.includes('sophomore')) {
        reply = `200 Level Core Courses:
• BUS 201: Principles of Management II (Organizational Theory)
• BUS 202: Basic Marketing
• BUS 203: Business Mathematics & Decision Statistics
• BUS 204: Elements of Commercial Law
• ACC 201: Financial Accounting
• ECO 201: Microeconomic Theory`;
      } else if (lower.includes('300')) {
        reply = `300 Level Core Courses:
• BUS 301: Organizational Behaviour
• BUS 303: Operations Research & Quantitative Techniques
• BUS 305: Marketing Management & Strategy
• BUS 307: Human Resource Management
• FIN 301: Business Finance`;
      } else if (lower.includes('400') || lower.includes('final year')) {
        reply = `400 Level Core Courses:
• BUS 401: Business Policy & Strategic Management I
• BUS 402: Business Policy & Strategic Management II
• BUS 403: International Business Strategy
• BUS 405: Production & Operations Management
• BUS 499: Final Year Research Project`;
      }

      setChatMessages((prev) => [...prev, { role: 'bot', text: reply, time: 'Just now' }]);
    }, 280);
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

    const numericCgpa = parseFloat(cumulativeCgpa);
    let honors = 'Pass Degree';

    if (numericCgpa >= 4.5) {
      honors = 'First Class Honours (Distinction)';
    } else if (numericCgpa >= 3.5) {
      honors = 'Second Class Honours (Upper Division)';
    } else if (numericCgpa >= 2.4) {
      honors = 'Second Class Honours (Lower Division)';
    } else if (numericCgpa >= 1.5) {
      honors = 'Third Class Honours';
    }

    return { currentGpa, cumulativeCgpa, currentUnits, currentPoints, honors };
  };

  const cgpaStats = calculateCgpa();

  // Research Topic Generator
  const generateResearchTopics = () => {
    const topicsMap: Record<string, string[]> = {
      'General Management': [
        "Strategic Planning and Operational Performance in Emerging Small and Medium Enterprises.",
        "Organizational Culture as a Catalyst for Employee Commitment in Commercial Organizations.",
        "Change Management Strategies and Enterprise Agility During Economic Realignments.",
        "Leadership Paradigms and Productivity: A Study of High-Growth Establishments.",
        "Corporate Governance Mechanisms and Value Creation in Developing Market Sectors."
      ],
      'Marketing & Consumer Behaviour': [
        "Digital Influencer Marketing and Brand Equity Formation Among Young Demographics.",
        "Customer Experience Architecture and Retention Dynamics in Digital Banking.",
        "Sustainable Packaging Solutions and Modern Consumer Purchase Intentions.",
        "Algorithmic Advertising Precision and Market Share Trajectory in Telecommunications.",
        "Ethical Brand Positioning and Willingness to Pay Premium Price Points."
      ],
      'Human Resource Management': [
        "Continuous Learning Initiatives and Employee Retention in Knowledge-Driven Firms.",
        "Remote Work Flexibility and Organizational Performance Metrics.",
        "Objective Performance Appraisals as Drivers of Autonomous Worker Motivation.",
        "Holistic Talent Acquisition Practices in Modern Service Industries.",
        "Equity-Based Reward Architectures and Workplace Morale."
      ],
      'Finance & Quantitative Business': [
        "Dynamic Working Capital Management and Enterprise Profitability.",
        "Fintech Adoption Velocity and Financial Inclusion Across Underserved Demographics.",
        "Capital Structure Optimization and Equity Valuation in Commercial Banking.",
        "Micro-Financing Facilities and the Scaling of Small Local Businesses.",
        "Currency Exchange Exposure and Supply Chain Cost Inflation."
      ]
    };

    setGeneratedTopics(topicsMap[projectArea] || topicsMap['General Management']);
    showToast('Generated research topics for ' + projectArea);
  };

  // Submit Complaint / Suggestion
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbMatric.trim() || !fbSubject.trim() || !fbDetails.trim()) {
      showToast('Please complete all required fields.');
      return;
    }

    const ticketId = 'ACAD-TIC-' + Math.floor(100000 + Math.random() * 900000);
    const newTicket: ComplaintTicket = {
      ticketId,
      matricNumber: fbMatric.trim().toUpperCase(),
      studentName: fbName.trim() || 'Anonymous Student',
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
      await logAuditAction('Ticket Logged', newTicket.matricNumber, `Ticket ${ticketId} regarding ${newTicket.subject}`);
      setSubmittedTicketId(ticketId);
      setFbSubject('');
      setFbDetails('');
      showToast(`Ticket logged. Reference: ${ticketId}`);
      await refreshAllData();
    } catch (err) {
      console.error('Feedback submit error:', err);
      showToast('Unable to submit ticket.');
    }
  };

  // Track ticket
  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackTicketInput.trim().toUpperCase();
    if (!query) return;

    setTrackTicketSearched(true);
    const tickets = await dbGetAll<ComplaintTicket>('suggestions');
    const match = tickets.find((t) => t.ticketId.toUpperCase() === query);
    setTrackedTicket(match || null);
  };

  // Admin Login
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinSetting = await dbGet<any>('settings', 'adminPin');
    const storedPin = pinSetting ? pinSetting.value : '2026';

    if (adminPinInput.trim() === storedPin) {
      sessionStorage.setItem('apple_clean_auth', 'true');
      setIsAdminLoggedIn(true);
      setIsAdminAuthModalOpen(false);
      setAdminPinInput('');
      setAdminAuthError(false);
      showToast('Welcome, Administrator.');
      await logAuditAction('Admin Login', 'Officer', 'Session started');
      await refreshAllData();
      setActiveSection('admin');
    } else {
      setAdminAuthError(true);
    }
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Sign Out',
      message: 'Are you sure you want to end your administrative session?',
      confirmText: 'Sign Out',
      confirmColor: 'bg-[#1D1D1F] hover:bg-black',
      onConfirm: async () => {
        sessionStorage.removeItem('apple_clean_auth');
        setIsAdminLoggedIn(false);
        setActiveSection('resources');
        showToast('Signed out.');
        await logAuditAction('Admin Logout', 'Officer', 'Session ended');
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Approve student upload
  const approveStudentUpload = async (uploadItem: PendingUpload) => {
    try {
      const newResource: AcademicResource = {
        id: 'res-' + Date.now(),
        code: uploadItem.code,
        title: uploadItem.title,
        level: uploadItem.level,
        type: uploadItem.type,
        format: uploadItem.format,
        size: uploadItem.size,
        date: new Date().toISOString().split('T')[0],
        uploader: uploadItem.uploader,
        description: uploadItem.description,
        isDemo: false,
        driveUrl: GOOGLE_DRIVE_FOLDER_URL,
        trackingId: uploadItem.trackingId,
        fileName: uploadItem.fileName,
        fileBlob: uploadItem.fileBlob,
        isStudentUpload: true,
        driveSynced: true
      };

      await dbPut('resources', newResource);
      await dbDelete('pending_uploads', uploadItem.trackingId);
      await logAuditAction('Resource Verified', 'Officer', `Verified ${uploadItem.code} (${uploadItem.title})`);
      showToast(`Verified ${uploadItem.code}.`);
      await refreshAllData();
    } catch (err) {
      console.error('Approval error:', err);
      showToast('Unable to approve resource.');
    }
  };

  // Reject student upload
  const rejectStudentUpload = (uploadItem: PendingUpload) => {
    setPromptModal({
      isOpen: true,
      title: `Reject Submission (${uploadItem.trackingId})`,
      label: 'Specify reason for the contributor:',
      placeholder: 'Document did not meet syllabus or legibility guidelines...',
      initialValue: '',
      onSubmit: async (reason) => {
        uploadItem.status = 'rejected';
        uploadItem.rejectionReason = reason || 'Document did not meet syllabus guidelines.';
        await dbPut('pending_uploads', uploadItem);
        await logAuditAction('Material Rejected', 'Officer', `Rejected [${uploadItem.trackingId}]`);
        showToast('Submission rejected.');
        setPromptModal((prev) => ({ ...prev, isOpen: false }));
        await refreshAllData();
      }
    });
  };

  // Soft delete resource to recycle bin
  const softDeleteResource = (item: AcademicResource) => {
    setConfirmModal({
      isOpen: true,
      title: 'Move to Trash',
      message: `Move "${item.code}: ${item.title}" to the trash? It can be restored later.`,
      confirmText: 'Move to Trash',
      confirmColor: 'bg-[#1D1D1F] hover:bg-black',
      onConfirm: async () => {
        await dbPut('recycled_resources', item);
        await dbDelete('resources', item.id);
        await logAuditAction('Resource Trashed', 'Officer', `Moved ${item.code} to trash`);
        showToast(`Moved ${item.code} to trash.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await refreshAllData();
      }
    });
  };

  // Restore resource from recycle bin
  const restoreRecycledResource = async (item: AcademicResource) => {
    await dbPut('resources', item);
    await dbDelete('recycled_resources', item.id);
    await logAuditAction('Resource Restored', 'Officer', `Restored ${item.code}`);
    showToast(`Restored ${item.code}.`);
    await refreshAllData();
  };

  // Permanently delete resource
  const permanentDeleteResource = (item: AcademicResource) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Permanently',
      message: `Permanently delete "${item.code}: ${item.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        await dbDelete('recycled_resources', item.id);
        await logAuditAction('Permanent Deletion', 'Officer', `Deleted ${item.code}`);
        showToast(`Permanently deleted ${item.code}.`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await refreshAllData();
      }
    });
  };

  // Empty recycle bin
  const emptyRecycleBin = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Empty Trash',
      message: 'Permanently remove all items in the trash? This action cannot be undone.',
      confirmText: 'Empty Trash',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        for (const item of recycledResources) {
          await dbDelete('recycled_resources', item.id);
        }
        await logAuditAction('Trash Emptied', 'Officer', 'Cleared all items');
        showToast('Trash emptied.');
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await refreshAllData();
      }
    });
  };

  // Respond to ticket modal
  const handleRespondToTicket = (ticket: ComplaintTicket) => {
    setPromptModal({
      isOpen: true,
      title: `Response to ${ticket.ticketId}`,
      label: `Enter official response for ${ticket.matricNumber}:`,
      placeholder: 'State the resolution or guidance...',
      initialValue: ticket.excosResponse || '',
      onSubmit: async (response) => {
        ticket.excosResponse = response;
        ticket.status = 'Resolved';
        ticket.resolvedAt = new Date().toISOString().split('T')[0];
        await dbPut('suggestions', ticket);
        await logAuditAction('Ticket Resolved', 'Officer', `Responded to ${ticket.ticketId}`);
        showToast('Response saved.');
        setPromptModal((prev) => ({ ...prev, isOpen: false }));
        await refreshAllData();
      }
    });
  };

  // Change Admin Pin
  const [currentPinField, setCurrentPinField] = useState('');
  const [newPinField, setNewPinField] = useState('');
  const [confirmPinField, setConfirmPinField] = useState('');

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinSetting = await dbGet<any>('settings', 'adminPin');
    const storedPin = pinSetting ? pinSetting.value : '2026';

    if (currentPinField !== storedPin) {
      showToast('Current passcode is incorrect.');
      return;
    }
    if (!newPinField || newPinField !== confirmPinField) {
      showToast('New passcodes do not match.');
      return;
    }
    if (newPinField.length < 4) {
      showToast('Passcode must be at least 4 digits.');
      return;
    }

    await dbPut('settings', { key: 'adminPin', value: newPinField });
    await logAuditAction('Passcode Changed', 'Officer', 'Passcode updated');
    showToast('Passcode updated.');
    setCurrentPinField('');
    setNewPinField('');
    setConfirmPinField('');
  };

  // Export JSON Handover Package
  const handleExportBackup = async () => {
    const res = await dbGetAll('resources');
    const pending = await dbGetAll('pending_uploads');
    const recycled = await dbGetAll('recycled_resources');
    const tickets = await dbGetAll('suggestions');
    const leaders = await dbGetAll('leadership');
    const logs = await dbGetAll('audit_logs');

    const backupData = {
      meta: {
        department: 'Business Administration Academic Platform',
        exportedAt: new Date().toISOString(),
        driveBackend: GOOGLE_DRIVE_FOLDER_URL
      },
      resources: res,
      pending_uploads: pending,
      recycled_resources: recycled,
      suggestions: tickets,
      leadership: leaders,
      audit_logs: logs
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Academic_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('Backup downloaded.');
  };

  // Report Resource Submission
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalResource) return;

    const reportItem = {
      id: 'rep-' + Date.now(),
      resourceId: reportModalResource.id,
      resourceTitle: `${reportModalResource.code} - ${reportModalResource.title}`,
      reason: reportReason,
      notes: reportNotes,
      date: new Date().toISOString().split('T')[0]
    };

    await dbPut('reports', reportItem);
    await logAuditAction('Resource Reported', 'User', `Flagged ${reportModalResource.code} (${reportReason})`);
    showToast('Report received. Thank you.');
    setReportModalResource(null);
    setReportNotes('');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1D1D1F]/90 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2.5 animate-fade-in text-xs font-medium">
          <Check className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 text-center animate-scale-up">
            <h3 className="text-base font-semibold text-[#1D1D1F] mb-1.5">{confirmModal.title}</h3>
            <p className="text-xs text-[#86868B] mb-6 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 text-xs font-medium text-[#1D1D1F] bg-[#E8E8ED] hover:bg-[#D8D8DD] rounded-full transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2 text-xs font-medium text-white rounded-full transition cursor-pointer ${
                  confirmModal.confirmColor || 'bg-[#0071E3] hover:bg-[#0077ED]'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 animate-scale-up">
            <h3 className="text-base font-semibold text-[#1D1D1F] mb-1">{promptModal.title}</h3>
            <label className="block text-xs text-[#86868B] mb-2 font-normal">
              {promptModal.label}
            </label>
            <textarea
              id="promptModalTextarea"
              rows={3}
              defaultValue={promptModal.initialValue || ''}
              placeholder={promptModal.placeholder || 'Type here...'}
              className="w-full px-3.5 py-2.5 text-xs bg-[#F5F5F7] border border-black/5 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0071E3] outline-none mb-5"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-medium text-[#1D1D1F] bg-[#E8E8ED] hover:bg-[#D8D8DD] rounded-full transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('promptModalTextarea') as HTMLTextAreaElement;
                  promptModal.onSubmit(el ? el.value : '');
                }}
                className="px-5 py-2 text-xs font-medium text-white bg-[#0071E3] hover:bg-[#0077ED] rounded-full transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple-style Top Bar */}
      <nav className="sticky top-0 z-40 apple-glass border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-13">
            {/* Logo */}
            <div
              onClick={() => setActiveSection('resources')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className="font-semibold text-sm tracking-tight text-[#1D1D1F]">
                Business Administration
              </span>
              <span className="text-xs text-[#86868B] hidden sm:inline">
                Academic Hub
              </span>
            </div>

            {/* Desktop Navigation Links (Clean Text with subtle hovers, NO pills) */}
            <div className="hidden md:flex items-center gap-6 text-xs font-normal">
              <button
                onClick={() => setActiveSection('resources')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'resources' ? 'text-[#0071E3] font-medium' : 'text-[#1D1D1F] hover:text-[#0071E3]'
                }`}
              >
                Resources
              </button>

              <button
                onClick={() => setActiveSection('upload')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'upload' ? 'text-[#0071E3] font-medium' : 'text-[#1D1D1F] hover:text-[#0071E3]'
                }`}
              >
                Upload
              </button>

              <button
                onClick={() => setActiveSection('assistant')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'assistant' ? 'text-[#0071E3] font-medium' : 'text-[#1D1D1F] hover:text-[#0071E3]'
                }`}
              >
                Assistant & Tools
              </button>

              <button
                onClick={() => setActiveSection('suggestions')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'suggestions' ? 'text-[#0071E3] font-medium' : 'text-[#1D1D1F] hover:text-[#0071E3]'
                }`}
              >
                Feedback
              </button>

              <button
                onClick={() => setActiveSection('leadership')}
                className={`transition-colors cursor-pointer ${
                  activeSection === 'leadership' ? 'text-[#0071E3] font-medium' : 'text-[#1D1D1F] hover:text-[#0071E3]'
                }`}
              >
                Directory
              </button>

              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0071E3] hover:opacity-80 transition inline-flex items-center gap-1 font-medium"
              >
                <span>Google Drive</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>

              <button
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setActiveSection('admin');
                  } else {
                    setIsAdminAuthModalOpen(true);
                  }
                }}
                className="text-xs text-[#86868B] hover:text-[#1D1D1F] transition cursor-pointer"
              >
                {isAdminLoggedIn ? 'Console' : 'Admin'}
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-3">
              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0071E3] font-medium inline-flex items-center gap-0.5"
              >
                <span>Drive</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-[#1D1D1F] hover:bg-black/5 rounded-full"
                aria-label="Navigation"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-black/5 px-6 py-4 space-y-3 text-sm">
            <button
              onClick={() => {
                setActiveSection('resources');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-[#1D1D1F]"
            >
              Resources
            </button>
            <button
              onClick={() => {
                setActiveSection('upload');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-[#1D1D1F]"
            >
              Upload Material
            </button>
            <button
              onClick={() => {
                setActiveSection('assistant');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-[#1D1D1F]"
            >
              Assistant & Tools
            </button>
            <button
              onClick={() => {
                setActiveSection('suggestions');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-[#1D1D1F]"
            >
              Feedback & Grievances
            </button>
            <button
              onClick={() => {
                setActiveSection('leadership');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-[#1D1D1F]"
            >
              Directory
            </button>
            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  setActiveSection('admin');
                } else {
                  setIsAdminAuthModalOpen(true);
                }
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-1 text-[#86868B]"
            >
              Administrative Portal
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section — Apple-style typography, generous whitespace, confident simplicity */}
      <section className="pt-16 pb-14 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <span className="text-xs font-semibold text-[#86868B] tracking-wide uppercase">
          Department of Business Administration
        </span>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.03em] text-[#1D1D1F] leading-[1.08] mt-3">
          Academic Resources.
          <span className="block text-[#86868B] font-normal mt-1">Brilliantly organized.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#86868B] max-w-xl mx-auto mt-4 font-normal leading-relaxed">
          Course handouts, past examination series, and verified student notes. Built for Business Administration, connected to Google Drive.
        </p>

        {/* Apple-style Pill CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <a
            href={GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="apple-button-primary px-6 py-2.5 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 shadow-xs"
          >
            <span>Open Google Drive</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setActiveSection('resources')}
            className="apple-button-secondary px-6 py-2.5 text-xs sm:text-sm font-medium cursor-pointer"
          >
            Browse Materials
          </button>

          <button
            onClick={() => setActiveSection('upload')}
            className="text-xs sm:text-sm font-medium text-[#0071E3] hover:underline px-3 py-2 cursor-pointer inline-flex items-center gap-1"
          >
            <span>Upload Notes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Minimal Metric Separation */}
        <div className="flex items-center justify-center gap-6 mt-12 text-xs text-[#86868B]">
          <span>100L – 400L Curriculum</span>
          <span aria-hidden="true">·</span>
          <span>Google Drive Backend</span>
          <span aria-hidden="true">·</span>
          <span>100MB File Support</span>
          <span aria-hidden="true">·</span>
          <span>Offline AI Tutor</span>
        </div>
      </section>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pb-20">
        {/* SECTION 1: ACADEMIC RESOURCE BANK */}
        {activeSection === 'resources' && (
          <div className="space-y-8">
            {/* Filter Bar (Apple-style Segmented Controls) */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                    Resource Bank
                  </h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Curriculum syllabi, examination papers, and lecture summaries.
                  </p>
                </div>

                {/* Collection Segmented Control */}
                <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex self-start sm:self-auto text-xs">
                  <button
                    onClick={() => setSourceFilter('ALL')}
                    className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                      sourceFilter === 'ALL' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    All ({resources.length})
                  </button>
                  <button
                    onClick={() => setSourceFilter('VERIFIED')}
                    className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                      sourceFilter === 'VERIFIED' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    Curriculum ({resources.filter((r) => !r.isStudentUpload).length})
                  </button>
                  <button
                    onClick={() => setSourceFilter('STUDENT_UPLOADS')}
                    className={`px-3.5 py-1 rounded-full font-medium transition cursor-pointer ${
                      sourceFilter === 'STUDENT_UPLOADS' ? 'bg-white text-[#0071E3] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    Drive Uploads ({resources.filter((r) => r.isStudentUpload).length})
                  </button>
                </div>
              </div>

              {/* Academic Level & Search Controls */}
              <div className="space-y-3 pt-1">
                {/* Level Tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {['ALL', '100 Level', '200 Level', '300 Level', '400 Level'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevelFilter(lvl)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                        levelFilter === lvl
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E8E8ED]'
                      }`}
                    >
                      {lvl === 'ALL' ? 'All Levels' : lvl}
                    </button>
                  ))}
                </div>

                {/* Course Codes Inline */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-xs text-[#86868B] mr-1">Courses:</span>
                  {['ALL', 'BUS 101', 'BUS 103', 'BUS 201', 'BUS 203', 'BUS 301', 'BUS 305', 'BUS 401', 'BUS 403'].map((code) => (
                    <button
                      key={code}
                      onClick={() => setCourseChipFilter(code)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                        courseChipFilter === code
                          ? 'bg-[#0071E3] text-white font-medium'
                          : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>

                {/* Search Bar & Category Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="sm:col-span-2 relative">
                    <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search courses, titles, or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F5F5F7] rounded-xl focus:bg-white focus:ring-1 focus:ring-[#0071E3] outline-none"
                    />
                  </div>
                  <div>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl text-[#1D1D1F] font-normal outline-none cursor-pointer"
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
            </div>

            {/* Resources List / Cards — Clean unboxed metadata, crisp titles */}
            {filteredResources.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-black/5">
                <p className="text-sm text-[#86868B]">No matching academic materials found.</p>
                <button
                  onClick={() => {
                    setLevelFilter('ALL');
                    setTypeFilter('ALL');
                    setCourseChipFilter('ALL');
                    setSourceFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-[#0071E3] hover:underline cursor-pointer font-medium"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredResources.map((item) => (
                  <div
                    key={item.id}
                    className="apple-card p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Quiet unboxed metadata line (NO static pills) */}
                      <div className="flex items-center gap-2 text-xs text-[#86868B]">
                        <span className="font-semibold text-[#1D1D1F]">{item.code}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.level}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.type}</span>
                        {item.isStudentUpload && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#0071E3] font-medium">Drive Synced</span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-base text-[#1D1D1F] mt-2 tracking-tight leading-snug">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-[#86868B] mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Contributor */}
                      <div className="text-[11px] text-[#A1A1A6] mt-3">
                        By {item.uploader} · {item.date}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-5 border-t border-black/5 flex items-center justify-between text-xs">
                      <span className="text-[#86868B]">
                        {item.format} ({item.size})
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewResource(item)}
                          className="text-[#86868B] hover:text-[#1D1D1F] transition cursor-pointer"
                        >
                          Preview
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownload(item)}
                          className="text-[#0071E3] font-medium hover:underline transition cursor-pointer"
                        >
                          Download
                        </button>

                        <a
                          href={item.driveUrl || GOOGLE_DRIVE_FOLDER_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#86868B] hover:text-[#0071E3] transition inline-flex items-center gap-0.5"
                          title="Open in Drive"
                        >
                          <span>Drive</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>

                        <button
                          type="button"
                          onClick={() => setReportModalResource(item)}
                          className="text-[#A1A1A6] hover:text-red-600 transition cursor-pointer"
                          title="Report item"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: STUDENT RESOURCE UPLOAD SYSTEM (100MB) */}
        {activeSection === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                Upload Course Material
              </h2>
              <p className="text-sm text-[#86868B] mt-1.5">
                Saved and linked directly with the departmental Google Drive repository.
              </p>

              {/* Segmented control for Upload views */}
              <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex text-xs mt-5">
                <button
                  onClick={() => setUploadTab('submit')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    uploadTab === 'submit' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Submit Document
                </button>
                <button
                  onClick={() => setUploadTab('live_uploads')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    uploadTab === 'live_uploads' ? 'bg-white text-[#0071E3] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Recent Uploads ({recentStudentUploads.length})
                </button>
                <button
                  onClick={() => setUploadTab('track')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    uploadTab === 'track' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Track Code
                </button>
              </div>
            </div>

            {uploadTab === 'submit' && (
              <div className="bg-white p-7 sm:p-9 rounded-3xl border border-black/5 shadow-xs space-y-6">
                {uploadResultTrackingId && (
                  <div className="bg-[#F5F5F7] p-5 rounded-2xl text-xs space-y-2.5">
                    <div className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#0071E3]" />
                      <span>Document published to the Resource Bank</span>
                    </div>
                    <p className="text-[#86868B] leading-relaxed">
                      Your document is live for fellow students. Tracking code: <strong className="font-mono text-[#1D1D1F]">{uploadResultTrackingId}</strong>
                    </p>
                    <div className="flex gap-3 pt-1">
                      <a
                        href={GOOGLE_DRIVE_FOLDER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071E3] font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open Drive Folder</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => {
                          setSourceFilter('STUDENT_UPLOADS');
                          setActiveSection('resources');
                        }}
                        className="text-[#86868B] hover:text-[#1D1D1F] transition cursor-pointer"
                      >
                        View in Resource Bank
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleStudentUpload} className="space-y-5">
                  {/* Dropzone */}
                  <div>
                    <label className="block text-xs font-medium text-[#1D1D1F] mb-1.5">
                      File (PDF, Word, PowerPoint, Excel up to 100MB)
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setUploadFile(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => document.getElementById('fileUploadInput')?.click()}
                      className={`border border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                        uploadFile ? 'border-[#0071E3] bg-[#0071E3]/5' : 'border-black/10 hover:border-black/25 bg-[#F5F5F7]'
                      }`}
                    >
                      <input
                        id="fileUploadInput"
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
                            {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-[#86868B]">
                          <Upload className="w-6 h-6 text-[#86868B] mx-auto mb-2 opacity-60" />
                          <span className="font-medium text-[#1D1D1F]">Choose a file</span> or drag and drop here
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Academic Level</label>
                      <select
                        value={uploadLevel}
                        onChange={(e) => setUploadLevel(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl text-[#1D1D1F] outline-none"
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
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl text-[#1D1D1F] outline-none"
                      >
                        <option value="Lecture Note">Lecture Note</option>
                        <option value="Past Question">Past Examination Question</option>
                        <option value="Textbook">Textbook</option>
                        <option value="Assignment">Assignment Solution</option>
                      </select>
                    </div>

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
                      <label className="block text-xs text-[#86868B] mb-1">Course Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Principles of Management II"
                        value={uploadCourseTitle}
                        onChange={(e) => setUploadCourseTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Henri Fayol 14 Principles Lecture Summary"
                      value={uploadDocTitle}
                      onChange={(e) => setUploadDocTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Summary (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Brief note on chapters or exam years included..."
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Contact (Optional)</label>
                      <input
                        type="text"
                        placeholder="Phone or email"
                        value={uploadContact}
                        onChange={(e) => setUploadContact(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full apple-button-primary py-2.5 text-xs font-medium cursor-pointer"
                  >
                    Upload Document
                  </button>
                </form>
              </div>
            )}

            {/* TAB: RECENT UPLOADS */}
            {uploadTab === 'live_uploads' && (
              <div className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Student Documents Synced with Google Drive
                </h3>
                {recentStudentUploads.length === 0 ? (
                  <p className="text-xs text-[#86868B] py-6 text-center">No student uploads yet.</p>
                ) : (
                  <div className="divide-y divide-black/5">
                    {recentStudentUploads.map((up) => (
                      <div key={up.id} className="py-3.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-[#1D1D1F]">
                            {up.code} · {up.title}
                          </div>
                          <div className="text-[11px] text-[#86868B] mt-0.5">
                            {up.level} · {up.size} · Uploaded by {up.uploader}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownload(up)}
                            className="text-[#0071E3] hover:underline font-medium cursor-pointer"
                          >
                            Download
                          </button>
                          <a
                            href={GOOGLE_DRIVE_FOLDER_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#86868B] hover:text-[#1D1D1F] inline-flex items-center gap-0.5"
                          >
                            <span>Drive</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: TRACK SUBMISSION */}
            {uploadTab === 'track' && (
              <div className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Track Submission Status</h3>
                <form onSubmit={handleSearchTracking} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter code (e.g. ACAD-SUB-123456)"
                    value={trackSearchId}
                    onChange={(e) => setTrackSearchId(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-[#F5F5F7] rounded-xl font-mono uppercase outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <button
                    type="submit"
                    className="apple-button-primary px-4 py-2 text-xs font-medium cursor-pointer"
                  >
                    Track
                  </button>
                </form>

                {trackSearched && (
                  <div className="pt-3 border-t border-black/5 text-xs">
                    {trackedUpload ? (
                      <div className="space-y-1.5">
                        <div className="font-semibold text-[#1D1D1F]">
                          {trackedUpload.code}: {trackedUpload.title}
                        </div>
                        <p className="text-[#86868B]">
                          Status: <span className="text-[#0071E3] font-medium">Published in Resource Bank & Drive</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[#86868B]">No record found for "{trackSearchId}".</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: OFFLINE AI ASSISTANT & ACADEMIC TOOLKIT */}
        {activeSection === 'assistant' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                Academic Assistant
              </h2>
              <p className="text-sm text-[#86868B] mt-1.5">
                Offline syllabus intelligence, CGPA forecasting, and research tools.
              </p>

              {/* Segmented controls */}
              <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex text-xs mt-4">
                <button
                  onClick={() => setAiTab('tutor')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    aiTab === 'tutor' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  AI Tutor
                </button>
                <button
                  onClick={() => setAiTab('cgpa')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    aiTab === 'cgpa' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  5.0 CGPA
                </button>
                <button
                  onClick={() => setAiTab('timer')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    aiTab === 'timer' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Focus Timer
                </button>
                <button
                  onClick={() => setAiTab('research')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    aiTab === 'research' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Research Topics
                </button>
              </div>
            </div>

            {/* AI TAB: TUTOR CHAT (Apple Messages Style) */}
            {aiTab === 'tutor' && (
              <div className="bg-white rounded-3xl border border-black/5 shadow-xs overflow-hidden flex flex-col h-[540px]">
                {/* Inquiry chips */}
                <div className="px-4 py-2.5 bg-[#F5F5F7] border-b border-black/5 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
                  <span className="text-[#86868B] text-[11px] shrink-0 mr-1">Suggested:</span>
                  {[
                    "Henri Fayol's 14 Principles",
                    "Max Weber's Bureaucracy",
                    "5.0 CGPA Formula",
                    "Project Chapters 1 to 5",
                    "100L Courses",
                    "Google Drive Link"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendAi(chip)}
                      className="px-2.5 py-1 rounded-full bg-white text-[#1D1D1F] hover:bg-black/5 transition text-xs whitespace-nowrap cursor-pointer shadow-2xs"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Messages stream */}
                <div ref={chatScrollRef} className="flex-1 p-5 overflow-y-auto space-y-3 bg-[#FAFAFC]">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-[#0071E3] text-white rounded-br-xs'
                            : 'bg-[#E8E8ED] text-[#1D1D1F] rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-[#A1A1A6] mt-1 px-1">{msg.time || 'now'}</span>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-3 bg-white border-t border-black/5 flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendAi();
                    }}
                    className="flex-1 px-4 py-2 text-xs bg-[#F5F5F7] rounded-full outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <button
                    onClick={() => handleSendAi()}
                    className="apple-button-primary px-4 py-2 text-xs font-medium cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* AI TAB: CGPA CALCULATOR */}
            {aiTab === 'cgpa' && (
              <div className="bg-white p-7 sm:p-9 rounded-3xl border border-black/5 shadow-xs space-y-6">
                <div className="text-center py-4">
                  <div className="text-xs uppercase text-[#86868B] font-medium tracking-wide">
                    Projected CGPA
                  </div>
                  <div className="text-5xl font-semibold tracking-tight text-[#1D1D1F] mt-1">
                    {cgpaStats.cumulativeCgpa}
                  </div>
                  <div className="text-xs text-[#0071E3] font-medium mt-1">
                    {cgpaStats.honors}
                  </div>
                  <div className="text-xs text-[#86868B] mt-1">
                    Semester GPA: {cgpaStats.currentGpa} ({cgpaStats.currentPoints} Quality Points ÷ {cgpaStats.currentUnits} Units)
                  </div>
                </div>

                {/* Course Inputs */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-[#86868B] pb-1">
                    <span>Registered Courses ({cgpaCourses.length})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCgpaCourses([
                          ...cgpaCourses,
                          { id: Date.now().toString(), code: `BUS ${200 + cgpaCourses.length}`, units: 3, grade: 'A' }
                        ]);
                      }}
                      className="text-[#0071E3] font-medium hover:underline cursor-pointer"
                    >
                      + Add Course
                    </button>
                  </div>

                  <div className="divide-y divide-black/5 border border-black/5 rounded-2xl overflow-hidden">
                    {cgpaCourses.map((c, idx) => (
                      <div key={c.id} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                        <input
                          type="text"
                          value={c.code}
                          onChange={(e) => {
                            const updated = [...cgpaCourses];
                            updated[idx].code = e.target.value;
                            setCgpaCourses(updated);
                          }}
                          className="w-24 px-2 py-1 bg-[#F5F5F7] rounded-lg uppercase font-medium"
                          placeholder="BUS 101"
                        />
                        <div className="flex items-center gap-1 text-[#86868B]">
                          <span>Units:</span>
                          <select
                            value={c.units}
                            onChange={(e) => {
                              const updated = [...cgpaCourses];
                              updated[idx].units = Number(e.target.value);
                              setCgpaCourses(updated);
                            }}
                            className="bg-[#F5F5F7] px-2 py-1 rounded-lg text-[#1D1D1F]"
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={6}>6</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1 text-[#86868B]">
                          <span>Grade:</span>
                          <select
                            value={c.grade}
                            onChange={(e) => {
                              const updated = [...cgpaCourses];
                              updated[idx].grade = e.target.value;
                              setCgpaCourses(updated);
                            }}
                            className="bg-[#F5F5F7] px-2 py-1 rounded-lg text-[#0071E3] font-medium"
                          >
                            <option value="A">A (5.0)</option>
                            <option value="B">B (4.0)</option>
                            <option value="C">C (3.0)</option>
                            <option value="D">D (2.0)</option>
                            <option value="E">E (1.0)</option>
                            <option value="F">F (0.0)</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (cgpaCourses.length > 1) {
                              setCgpaCourses(cgpaCourses.filter((_, i) => i !== idx));
                            }
                          }}
                          className="text-[#A1A1A6] hover:text-red-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI TAB: FOCUS TIMER */}
            {aiTab === 'timer' && (
              <div className="bg-white p-9 rounded-3xl border border-black/5 shadow-xs text-center space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    {timerMode === 'study' ? 'Focus Session' : 'Short Break'}
                  </h3>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Structured 25-minute study intervals.
                  </p>
                </div>

                <div className="font-mono text-6xl font-light text-[#1D1D1F] tracking-tight">
                  {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:
                  {String(timerSeconds % 60).padStart(2, '0')}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="apple-button-primary px-6 py-2 text-xs font-medium cursor-pointer"
                  >
                    {timerRunning ? 'Pause' : 'Start'}
                  </button>
                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSeconds(timerMode === 'study' ? 25 * 60 : 5 * 60);
                    }}
                    className="apple-button-secondary px-5 py-2 text-xs font-medium cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="text-xs text-[#86868B]">
                  Sessions completed today: {studySessionsCompleted}
                </div>
              </div>
            )}

            {/* AI TAB: RESEARCH TOPICS */}
            {aiTab === 'research' && (
              <div className="bg-white p-7 sm:p-9 rounded-3xl border border-black/5 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F]">
                    Research Topic Generator
                  </h3>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Curated research proposals for 400L final year projects.
                  </p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={projectArea}
                    onChange={(e) => setProjectArea(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl text-[#1D1D1F] outline-none"
                  >
                    <option value="General Management">Strategic & General Management</option>
                    <option value="Marketing & Consumer Behaviour">Marketing & Consumer Behaviour</option>
                    <option value="Human Resource Management">Human Resource Management</option>
                    <option value="Finance & Quantitative Business">Finance & Quantitative Analysis</option>
                  </select>
                  <button
                    type="button"
                    onClick={generateResearchTopics}
                    className="apple-button-primary px-4 py-2 text-xs font-medium cursor-pointer"
                  >
                    Generate
                  </button>
                </div>

                <div className="divide-y divide-black/5 text-xs">
                  {(generatedTopics.length > 0 ? generatedTopics : [
                    "Strategic Planning and Operational Performance in Emerging Small and Medium Enterprises.",
                    "Organizational Culture as a Catalyst for Employee Commitment in Commercial Organizations.",
                    "Change Management Strategies and Enterprise Agility During Economic Realignments.",
                    "Leadership Paradigms and Productivity: A Study of High-Growth Establishments."
                  ]).map((t, idx) => (
                    <div key={idx} className="py-3 flex items-start justify-between gap-3">
                      <p className="text-[#1D1D1F] leading-relaxed">{t}</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(t);
                          showToast('Topic copied.');
                        }}
                        className="text-[#86868B] hover:text-[#0071E3] p-1 cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: COMPLAINTS & FEEDBACK */}
        {activeSection === 'suggestions' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                Feedback & Grievance Desk
              </h2>
              <p className="text-sm text-[#86868B] mt-1.5">
                Direct channel to the Executive Council for CA inquiries, timetable concerns, or suggestions.
              </p>

              <div className="bg-[#E8E8ED] p-1 rounded-full inline-flex text-xs mt-5">
                <button
                  onClick={() => setFeedbackTab('submit')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    feedbackTab === 'submit' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Submit Inquiry
                </button>
                <button
                  onClick={() => setFeedbackTab('track')}
                  className={`px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
                    feedbackTab === 'track' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                  }`}
                >
                  Track Inquiry
                </button>
              </div>
            </div>

            {feedbackTab === 'submit' ? (
              <div className="bg-white p-7 sm:p-9 rounded-3xl border border-black/5 shadow-xs space-y-5">
                {submittedTicketId && (
                  <div className="bg-[#F5F5F7] p-5 rounded-2xl text-xs space-y-1.5">
                    <div className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-[#0071E3]" />
                      <span>Inquiry registered</span>
                    </div>
                    <p className="text-[#86868B]">
                      Reference number: <strong className="font-mono text-[#1D1D1F]">{submittedTicketId}</strong>
                    </p>
                  </div>
                )}

                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Matric Number</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 21/04/..."
                        value={fbMatric}
                        onChange={(e) => setFbMatric(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl uppercase outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Student Name</label>
                      <input
                        type="text"
                        placeholder="Name or Anonymous"
                        value={fbName}
                        onChange={(e) => setFbName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs text-[#86868B] mb-1">Level</label>
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
                        <option value="Course Materials">Course Material</option>
                        <option value="Missing CA Grades">Missing CA Score</option>
                        <option value="Lecture Clashes">Timetable Clash</option>
                        <option value="EXCOS Welfare">Department Welfare</option>
                        <option value="General Suggestion">General Suggestion</option>
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
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief headline..."
                      value={fbSubject}
                      onChange={(e) => setFbSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#86868B] mb-1">Details</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Explain the circumstance or question..."
                      value={fbDetails}
                      onChange={(e) => setFbDetails(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F5F5F7] rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full apple-button-primary py-2.5 text-xs font-medium cursor-pointer"
                  >
                    Submit Inquiry
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white p-7 rounded-3xl border border-black/5 shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Track Inquiry Status</h3>
                <form onSubmit={handleTrackTicket} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACAD-TIC-123456"
                    value={trackTicketInput}
                    onChange={(e) => setTrackTicketInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-[#F5F5F7] rounded-xl font-mono uppercase outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <button
                    type="submit"
                    className="apple-button-primary px-4 py-2 text-xs font-medium cursor-pointer"
                  >
                    Look Up
                  </button>
                </form>

                {trackTicketSearched && (
                  <div className="pt-3 border-t border-black/5 text-xs">
                    {trackedTicket ? (
                      <div className="space-y-2">
                        <div className="font-semibold text-[#1D1D1F]">
                          {trackedTicket.subject}
                        </div>
                        <p className="text-[#86868B]">
                          Status: <span className="text-[#0071E3] font-medium">{trackedTicket.status}</span>
                        </p>
                        {trackedTicket.excosResponse && (
                          <div className="p-3 bg-[#F5F5F7] rounded-xl text-xs text-[#1D1D1F] mt-2">
                            <strong>Response:</strong> {trackedTicket.excosResponse}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[#86868B]">No inquiry found for "{trackTicketInput}".</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: LEADERSHIP DIRECTORY */}
        {activeSection === 'leadership' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                Leadership Directory
              </h2>
              <p className="text-sm text-[#86868B] mt-1.5">
                Executive Council officers for the current academic session.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {leadership.map((leader, idx) => (
                <div
                  key={idx}
                  className="apple-card p-6 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-[#0071E3] tracking-wide uppercase">
                      {leader.role}
                    </span>
                    <h3 className="font-semibold text-base text-[#1D1D1F] mt-1">
                      {leader.name}
                    </h3>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Session: {leader.tenure}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-black/5 text-xs text-[#86868B] space-y-1">
                    <div className="truncate">
                      <a href={`mailto:${leader.email}`} className="text-[#0071E3] hover:underline">
                        {leader.email}
                      </a>
                    </div>
                    <div>{leader.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: ADMINISTRATIVE CONSOLE */}
        {activeSection === 'admin' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!isAdminLoggedIn ? (
              <div className="bg-white p-10 rounded-3xl border border-black/5 text-center max-w-sm mx-auto space-y-4">
                <h3 className="text-xl font-semibold text-[#1D1D1F]">Administrative Portal</h3>
                <p className="text-xs text-[#86868B]">
                  Enter your passcode to manage resources and moderations.
                </p>
                <button
                  onClick={() => setIsAdminAuthModalOpen(true)}
                  className="apple-button-primary w-full py-2.5 text-xs font-medium cursor-pointer"
                >
                  Enter Passcode (2026)
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Console header */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#1D1D1F]">Administrative Console</h2>
                    <p className="text-xs text-[#86868B] mt-0.5">
                      Connected to Drive: <code className="font-mono text-[#0071E3]">{GOOGLE_DRIVE_FOLDER_ID}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={GOOGLE_DRIVE_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="apple-button-secondary px-3.5 py-1.5 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <span>Drive</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                    <button
                      onClick={handleAdminLogout}
                      className="text-xs text-red-600 hover:underline px-2 py-1 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Subnav */}
                <div className="bg-[#E8E8ED] p-1 rounded-full flex items-center gap-1 overflow-x-auto text-xs">
                  {[
                    { id: 'pending', label: `Pending (${pendingUploads.length})` },
                    { id: 'resources', label: `Resources (${resources.length})` },
                    { id: 'recycle', label: `Trash (${recycledResources.length})` },
                    { id: 'tickets', label: `Inquiries (${allTickets.length})` },
                    { id: 'leadership', label: 'Directory' },
                    { id: 'pin', label: 'Passcode' },
                    { id: 'audit', label: 'Backup' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
                        adminTab === tab.id ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Moderation Queue */}
                {adminTab === 'pending' && (
                  <div className="bg-white p-7 rounded-3xl border border-black/5 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1D1D1F]">Pending Queue ({pendingUploads.length})</span>
                      <button onClick={refreshAllData} className="text-[#0071E3] hover:underline cursor-pointer">
                        Refresh
                      </button>
                    </div>

                    {pendingUploads.length === 0 ? (
                      <p className="text-xs text-[#86868B] py-6 text-center">No pending items.</p>
                    ) : (
                      <div className="divide-y divide-black/5 text-xs">
                        {pendingUploads.map((up) => (
                          <div key={up.trackingId} className="py-3.5 flex items-center justify-between gap-4">
                            <div>
                              <div className="font-semibold text-[#1D1D1F]">
                                {up.code} · {up.title}
                              </div>
                              <div className="text-[#86868B] text-[11px] mt-0.5">
                                {up.level} · By {up.uploader} · {up.size}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => approveStudentUpload(up)}
                                className="apple-button-primary px-3 py-1.5 text-xs font-medium cursor-pointer"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => rejectStudentUpload(up)}
                                className="text-red-600 hover:underline px-2 py-1 cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Active Resources */}
                {adminTab === 'resources' && (
                  <div className="bg-white p-7 rounded-3xl border border-black/5 space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1D1D1F]">All Active Documents ({resources.length})</span>
                      <button onClick={handleExportBackup} className="text-[#0071E3] hover:underline cursor-pointer">
                        Export JSON
                      </button>
                    </div>
                    <div className="divide-y divide-black/5 text-xs">
                      {resources.map((r) => (
                        <div key={r.id} className="py-2.5 flex items-center justify-between gap-4">
                          <div>
                            <span className="font-semibold text-[#1D1D1F]">{r.code}</span> · {r.title}
                          </div>
                          <button
                            onClick={() => softDeleteResource(r)}
                            className="text-red-600 hover:underline cursor-pointer"
                          >
                            Trash
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recycle Bin */}
                {adminTab === 'recycle' && (
                  <div className="bg-white p-7 rounded-3xl border border-black/5 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1D1D1F]">Trash ({recycledResources.length})</span>
                      {recycledResources.length > 0 && (
                        <button onClick={emptyRecycleBin} className="text-red-600 hover:underline cursor-pointer">
                          Empty Trash
                        </button>
                      )}
                    </div>
                    {recycledResources.length === 0 ? (
                      <p className="text-[#86868B] py-6 text-center">Trash is empty.</p>
                    ) : (
                      <div className="divide-y divide-black/5">
                        {recycledResources.map((item) => (
                          <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                            <div>{item.code}: {item.title}</div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => restoreRecycledResource(item)}
                                className="text-[#0071E3] hover:underline cursor-pointer"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => permanentDeleteResource(item)}
                                className="text-red-600 hover:underline cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tickets */}
                {adminTab === 'tickets' && (
                  <div className="bg-white p-7 rounded-3xl border border-black/5 space-y-4 text-xs">
                    <span className="font-semibold text-[#1D1D1F]">Student Inquiries ({allTickets.length})</span>
                    {allTickets.length === 0 ? (
                      <p className="text-[#86868B] py-6 text-center">No inquiries logged.</p>
                    ) : (
                      <div className="divide-y divide-black/5">
                        {allTickets.map((t) => (
                          <div key={t.ticketId} className="py-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#1D1D1F]">{t.subject}</span>
                              <span className="text-[#0071E3]">{t.status}</span>
                            </div>
                            <p className="text-[#86868B]">{t.details}</p>
                            <button
                              onClick={() => handleRespondToTicket(t)}
                              className="text-[#0071E3] font-medium hover:underline cursor-pointer pt-1"
                            >
                              {t.excosResponse ? 'Edit Response' : 'Reply & Resolve'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Passcode changer */}
                {adminTab === 'pin' && (
                  <div className="bg-white p-7 rounded-3xl border border-black/5 max-w-sm space-y-4 text-xs">
                    <h3 className="font-semibold text-[#1D1D1F]">Update Passcode</h3>
                    <form onSubmit={handleChangePin} className="space-y-3">
                      <input
                        type="password"
                        required
                        placeholder="Current passcode"
                        value={currentPinField}
                        onChange={(e) => setCurrentPinField(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F5F7] rounded-xl outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="New passcode"
                        value={newPinField}
                        onChange={(e) => setNewPinField(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F5F7] rounded-xl outline-none"
                      />
                      <input
                        type="password"
                        required
                        placeholder="Confirm new passcode"
                        value={confirmPinField}
                        onChange={(e) => setConfirmPinField(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F5F5F7] rounded-xl outline-none"
                      />
                      <button
                        type="submit"
                        className="apple-button-primary w-full py-2 text-xs font-medium cursor-pointer"
                      >
                        Update
                      </button>
                    </form>
                  </div>
                )}

                {/* Audit & Backup */}
                {adminTab === 'audit' && (
                  <div className="bg-white p-7 rounded-3xl border border-black/5 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#1D1D1F]">Audit Records & Handover</span>
                      <button
                        onClick={handleExportBackup}
                        className="apple-button-primary px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                      >
                        Download Backup
                      </button>
                    </div>
                    <div className="divide-y divide-black/5 font-mono text-[11px]">
                      {auditLogs.slice(0, 30).map((l) => (
                        <div key={l.id} className="py-2 flex items-center justify-between text-[#86868B]">
                          <span>{l.action}</span>
                          <span>{l.performedBy}</span>
                          <span>{new Date(l.timestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* DOCUMENT PREVIEW MODAL (Apple Clean Sheet) */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-scale-up">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#86868B]">
                  {previewResource.code} · {previewResource.level} · {previewResource.type}
                </span>
                <h3 className="font-semibold text-base text-[#1D1D1F] mt-0.5">
                  {previewResource.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewResource(null)}
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-[#86868B] leading-relaxed space-y-3 font-mono bg-[#F5F5F7]">
{`Course: ${previewResource.code} - ${previewResource.title}
Contributor: ${previewResource.uploader}
Date: ${previewResource.date}
Format: ${previewResource.format} (${previewResource.size})
Google Drive Link: ${previewResource.driveUrl || GOOGLE_DRIVE_FOLDER_URL}

Summary:
${previewResource.description}

Curriculum Topics:
1. Classical Management Theories & Scientific School
2. Henri Fayol's 14 Principles of Management
3. Decision Making Under Risk & Quantitative Formulations
4. Empirical Review & Examination Case Study Analysis`}
            </div>

            <div className="p-4 border-t border-black/5 flex items-center justify-between">
              <a
                href={previewResource.driveUrl || GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0071E3] font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>Open in Drive</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewResource(null)}
                  className="px-4 py-2 text-xs font-medium text-[#1D1D1F] bg-[#E8E8ED] hover:bg-[#D8D8DD] rounded-full cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownload(previewResource);
                    setPreviewResource(null);
                  }}
                  className="apple-button-primary px-4 py-2 text-xs font-medium cursor-pointer"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModalResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 animate-scale-up">
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-1">Report Resource</h3>
            <p className="text-xs text-[#86868B] mb-4">
              {reportModalResource.code}: {reportModalResource.title}
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#86868B] mb-1">Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5F7] rounded-xl outline-none"
                >
                  <option value="Outdated Content">Outdated syllabus</option>
                  <option value="Illegible Document">Illegible scan</option>
                  <option value="Incorrect Course Code">Incorrect course code</option>
                  <option value="Duplicate Upload">Duplicate document</option>
                </select>
              </div>

              <div>
                <label className="block text-[#86868B] mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Details..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F5F7] rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalResource(null)}
                  className="px-3 py-1.5 text-xs text-[#1D1D1F] bg-[#E8E8ED] hover:bg-[#D8D8DD] rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-full cursor-pointer font-medium"
                >
                  Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN AUTH MODAL */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-xs w-full p-6 text-center animate-scale-up">
            <h3 className="text-base font-semibold text-[#1D1D1F]">Administrator Passcode</h3>
            <p className="text-xs text-[#86868B] mt-1 mb-5">
              Enter your four-digit passcode.
            </p>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <input
                type="password"
                required
                autoFocus
                placeholder="••••"
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value);
                  setAdminAuthError(false);
                }}
                className="w-full px-4 py-2.5 bg-[#F5F5F7] text-center text-xl tracking-widest font-mono rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#0071E3]"
              />
              {adminAuthError && (
                <p className="text-xs text-red-600 font-medium">Incorrect passcode.</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-[#1D1D1F] bg-[#E8E8ED] hover:bg-[#D8D8DD] rounded-full cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 apple-button-primary py-2 text-xs font-medium cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apple-style Minimal Footer */}
      <footer className="border-t border-black/5 bg-[#F5F5F7] py-10 text-xs text-[#86868B]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="font-medium text-[#1D1D1F]">
              Department of Business Administration
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a
                href={GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0071E3] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Google Drive Repository</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
              <button
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setActiveSection('admin');
                  } else {
                    setIsAdminAuthModalOpen(true);
                  }
                }}
                className="hover:text-[#1D1D1F] cursor-pointer"
              >
                {isAdminLoggedIn ? 'Console' : 'Admin'}
              </button>
            </div>
          </div>
          <div className="text-[11px] text-[#A1A1A6]">
            Copyright © 2026 Department of Business Administration. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

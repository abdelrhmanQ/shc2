import { 
    db, 
    auth, 
    collection, 
    getDocs, 
    addDoc, 
    query, 
    where, 
    orderBy,
    doc,
    getDoc,
    onAuthStateChanged,
    signOut,
    Timestamp,
    serverTimestamp
} from './firebase.js';

class AttendanceManager {
    constructor() {
        this.adminSection = document.getElementById('admin-section');
        this.sessionForm = document.getElementById('session-form');
        this.qrDisplay = document.getElementById('qr-display');
        this.scanBtn = document.getElementById('scan-btn');
        this.recordsContainer = document.getElementById('records-container');
        this.endSessionBtn = document.getElementById('end-session-btn');
        
        this.currentSession = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAuth();
        this.loadAttendanceRecords();
    }

    setupEventListeners() {
        this.sessionForm.addEventListener('submit', (e) => this.generateSession(e));
        this.scanBtn.addEventListener('click', () => this.markAttendance());
        this.endSessionBtn.addEventListener('click', () => this.endSession());
    }

    setupAuth() {
        onAuthStateChanged(auth, (user) => {
            const adminLink = document.getElementById('admin-link');
            const userMenu = document.getElementById('user-menu');
            const loginLink = document.getElementById('login-nav-link');
            
            if (user) {
                loginLink.style.display = 'none';
                userMenu.style.display = 'block';
                this.checkIfAdmin(user.uid).then(isAdmin => {
                    if (isAdmin) {
                        this.adminSection.style.display = 'block';
                        if (adminLink) adminLink.style.display = 'block';
                    }
                });
                this.loadAttendanceRecords(user.uid);
            } else {
                loginLink.style.display = 'block';
                userMenu.style.display = 'none';
                this.adminSection.style.display = 'none';
                if (adminLink) adminLink.style.display = 'none';
            }
        });

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => {
                    window.location.href = 'index.html';
                });
            });
        }
    }

    async checkIfAdmin(uid) {
        // Implement admin check
        return false;
    }

    async generateSession(e) {
        e.preventDefault();
        
        const courseId = document.getElementById('course-id').value;
        const duration = parseInt(document.getElementById('session-duration').value);
        
        if (!courseId) {
            alert('Please enter a course ID');
            return;
        }

        try {
            const sessionId = this.generateSessionId();
            const expiresAt = new Date(Date.now() + duration * 60000);
            
            const sessionData = {
                sessionId: sessionId,
                courseId: courseId,
                createdBy: auth.currentUser.uid,
                startTime: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt),
                active: true
            };

            await addDoc(collection(db, 'attendanceSessions'), sessionData);
            
            this.currentSession = sessionData;
            this.displayActiveSession(sessionData);
            this.showMessage('Session created successfully!', 'success');
            
        } catch (error) {
            console.error('Error creating session:', error);
            this.showMessage('Failed to create session', 'error');
        }
    }

    generateSessionId() {
        return 'SESS_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    displayActiveSession(session) {
        this.qrDisplay.style.display = 'block';
        document.getElementById('current-session-id').textContent = session.sessionId;
        document.getElementById('current-course-id').textContent = session.courseId;
        document.getElementById('session-expiry').textContent = 
            session.expiresAt.toDate().toLocaleString();
    }

    async endSession() {
        if (!this.currentSession) return;
        
        try {
            // In a real implementation, you'd update the session in Firestore
            this.currentSession = null;
            this.qrDisplay.style.display = 'none';
            this.showMessage('Session ended', 'success');
        } catch (error) {
            console.error('Error ending session:', error);
            this.showMessage('Failed to end session', 'error');
        }
    }

async markAttendance() {
    const sessionCode = document.getElementById('session-code').value.trim();
    
    if (!sessionCode) {
        this.showNotification('Please enter a session code', 'error');
        return;
    }

    if (!auth.currentUser) {
        this.showNotification('Please log in to mark attendance', 'error');
        return;
    }

    // 30 كود عشوائي صالح
    const validCodes = [
        'ABC123', 'XYZ789', 'QWE456', 'RTY321', 'UIO654',
        'PAS987', 'DFG123', 'HJK456', 'LZX789', 'CVB321',
        'NMQ654', 'WER987', 'SDF123', 'XCV456', 'BNM789',
        'QAZ321', 'WSX654', 'EDC987', 'RFV123', 'TGB456',
        'YHN789', 'UJM321', 'IK654', 'OL987', 'P123',
        'A456', 'B789', 'C321', 'D654', 'E987'
    ];

    // التحقق إذا كان الكود من الأكواد الصالحة
    if (!validCodes.includes(sessionCode)) {
        this.showNotification('Invalid session code', 'error');
        return;
    }

    try {
        // محاكاة تسجيل الحضور
        const recordData = {
            sessionId: sessionCode,
            courseId: 'CS101', // يمكن تغييرها حسب الحاجة
            studentId: auth.currentUser.uid,
            studentEmail: auth.currentUser.email,
            timestamp: serverTimestamp(),
            status: 'present'
        };

        await addDoc(collection(db, 'attendanceRecords'), recordData);
        this.showNotification('Attendance marked successfully!', 'success');
        this.loadAttendanceRecords(auth.currentUser.uid);
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        this.showNotification('Failed to mark attendance', 'error');
    }
}

// أضف دالة الإشعارات
showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#00C851' : '#ff4444';
    notification.style.color = 'white';
    notification.style.position = 'fixed';
    notification.style.top = '100px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 2rem';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '10000';
    notification.style.animation = 'slideInRight 0.3s ease';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

    displayRecords(querySnapshot) {
        this.recordsContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            this.recordsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No attendance records found</p>
                </div>
            `;
            return;
        }

        querySnapshot.forEach((doc) => {
            const record = doc.data();
            const recordElement = this.createRecordElement(record);
            this.recordsContainer.appendChild(recordElement);
        });
    }

    createRecordElement(record) {
        const recordDiv = document.createElement('div');
        recordDiv.className = 'record-item';
        
        const date = record.timestamp?.toDate?.() || new Date();
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        recordDiv.innerHTML = `
            <div class="record-header">
                <strong>Course: ${record.courseId}</strong>
                <span class="record-date">${formattedDate}</span>
            </div>
            <div class="record-details">
                <span class="session-id">Session: ${record.sessionId}</span>
                <span class="status-present">Present</span>
            </div>
        `;

        return recordDiv;
    }

    showMessage(message, type) {
        // Simple message display - you might want to implement a better notification system
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AttendanceManager();
});
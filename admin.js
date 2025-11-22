class AdminManager {
    constructor() {
        this.assignmentsList = document.getElementById('assignments-list');
        this.newsList = document.getElementById('news-list');
        this.notificationArea = document.getElementById('notification-area');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAssignments();
        this.loadNews();
    }

    setupEventListeners() {
        // التبديل بين التبويبات
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // نموذج الواجبات
        document.getElementById('assignment-form').addEventListener('submit', (e) => this.handleAssignmentSubmit(e));
        
        // نموذج الأخبار
        document.getElementById('news-form').addEventListener('submit', (e) => this.handleNewsSubmit(e));
    }

    switchTab(tabName) {
        // تحديث التبويب النشط
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // تحديث القسم النشط
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.toggle('active', section.id === `${tabName}-section`);
        });
    }

    async handleAssignmentSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('assignment-title').value;
        const description = document.getElementById('assignment-description').value;
        const dueDate = document.getElementById('assignment-due-date').value;

        if (!title || !description || !dueDate) {
            this.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        try {
            this.showNotification('جاري إضافة الواجب...', 'info');

            const assignment = {
                id: this.generateId(),
                title: title,
                description: description,
                dueDate: dueDate,
                authorEmail: 'admin@shc.com',
                createdAt: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };

            this.saveAssignment(assignment);
            this.showNotification('تم إضافة الواجب بنجاح!', 'success');
            this.resetForm('assignment');
            this.loadAssignments();
            
        } catch (error) {
            console.error('خطأ في إضافة الواجب:', error);
            this.showNotification('فشل في إضافة الواجب', 'error');
        }
    }

    async handleNewsSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('news-title').value;
        const description = document.getElementById('news-description').value;

        if (!title || !description) {
            this.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        try {
            this.showNotification('جاري نشر الخبر...', 'info');

            const news = {
                id: this.generateId(),
                title: title,
                description: description,
                authorEmail: 'admin@shc.com',
                timestamp: new Date().toISOString()
            };

            this.saveNews(news);
            this.showNotification('تم نشر الخبر بنجاح!', 'success');
            this.resetForm('news');
            this.loadNews();
            
        } catch (error) {
            console.error('خطأ في نشر الخبر:', error);
            this.showNotification('فشل في نشر الخبر', 'error');
        }
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    saveAssignment(assignment) {
        const assignments = this.getAssignments();
        assignments.push(assignment);
        localStorage.setItem('assignments', JSON.stringify(assignments));
    }

    saveNews(news) {
        const newsItems = this.getNews();
        newsItems.push(news);
        localStorage.setItem('news', JSON.stringify(newsItems));
    }

    getAssignments() {
        return JSON.parse(localStorage.getItem('assignments') || '[]');
    }

    getNews() {
        return JSON.parse(localStorage.getItem('news') || '[]');
    }

    loadAssignments() {
        try {
            const assignments = this.getAssignments();
            this.displayAssignments(assignments);
        } catch (error) {
            console.error('خطأ في تحميل الواجبات:', error);
            this.showNotification('فشل في تحميل الواجبات', 'error');
        }
    }

    loadNews() {
        try {
            const newsItems = this.getNews();
            this.displayNews(newsItems);
        } catch (error) {
            console.error('خطأ في تحميل الأخبار:', error);
            this.showNotification('فشل في تحميل الأخبار', 'error');
        }
    }

    displayAssignments(assignments) {
        this.assignmentsList.innerHTML = '';
        
        if (assignments.length === 0) {
            this.assignmentsList.innerHTML = `
                <div class="empty-state">
                    <h3>لا توجد واجبات</h3>
                    <p>قم بإنشاء أول واجب باستخدام النموذج أعلاه</p>
                </div>
            `;
            return;
        }

        // ترتيب الواجبات من الأحدث إلى الأقدم
        assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        assignments.forEach((assignment) => {
            const assignmentElement = this.createAssignmentElement(assignment);
            this.assignmentsList.appendChild(assignmentElement);
        });
    }

    displayNews(newsItems) {
        this.newsList.innerHTML = '';
        
        if (newsItems.length === 0) {
            this.newsList.innerHTML = `
                <div class="empty-state">
                    <h3>لا توجد أخبار</h3>
                    <p>قم بنشر أول خبر باستخدام النموذج أعلاه</p>
                </div>
            `;
            return;
        }

        // ترتيب الأخبار من الأحدث إلى الأقدم
        newsItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        newsItems.forEach((news) => {
            const newsElement = this.createNewsElement(news);
            this.newsList.appendChild(newsElement);
        });
    }

    createAssignmentElement(assignment) {
        const assignmentDiv = document.createElement('div');
        assignmentDiv.className = 'item-card';
        
        const dueDate = new Date(assignment.dueDate);
        const now = new Date();
        const isOverdue = dueDate < now;
        
        const formattedDueDate = dueDate.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = isOverdue ? 'status-overdue' : 'status-upcoming';
        const statusText = isOverdue ? 'متأخر' : 'قادم';

        assignmentDiv.innerHTML = `
            <div class="item-content">
                <h4>${assignment.title}</h4>
                <p>${assignment.description}</p>
                <div style="margin-top: 0.5rem;">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                    <span style="color: var(--text-secondary); margin-right: 1rem;">موعد التسليم: ${formattedDueDate}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-delete" onclick="adminManager.deleteAssignment('${assignment.id}')">حذف</button>
            </div>
        `;

        return assignmentDiv;
    }

    createNewsElement(news) {
        const newsDiv = document.createElement('div');
        newsDiv.className = 'item-card';
        
        const date = new Date(news.timestamp);
        const formattedDate = date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        newsDiv.innerHTML = `
            <div class="item-content">
                <h4>${news.title}</h4>
                <p>${news.description}</p>
                <div style="margin-top: 0.5rem;">
                    <span style="color: var(--text-secondary);">تاريخ النشر: ${formattedDate}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn btn-delete" onclick="adminManager.deleteNews('${news.id}')">حذف</button>
            </div>
        `;

        return newsDiv;
    }

    deleteAssignment(id) {
        if (confirm('هل أنت متأكد من أنك تريد حذف هذا الواجب؟')) {
            try {
                const assignments = this.getAssignments();
                const filteredAssignments = assignments.filter(assignment => assignment.id !== id);
                localStorage.setItem('assignments', JSON.stringify(filteredAssignments));
                this.showNotification('تم حذف الواجب بنجاح', 'success');
                this.loadAssignments();
            } catch (error) {
                console.error('خطأ في حذف الواجب:', error);
                this.showNotification('فشل في حذف الواجب', 'error');
            }
        }
    }

    deleteNews(id) {
        if (confirm('هل أنت متأكد من أنك تريد حذف هذا الخبر؟')) {
            try {
                const newsItems = this.getNews();
                const filteredNews = newsItems.filter(news => news.id !== id);
                localStorage.setItem('news', JSON.stringify(filteredNews));
                this.showNotification('تم حذف الخبر بنجاح', 'success');
                this.loadNews();
            } catch (error) {
                console.error('خطأ في حذف الخبر:', error);
                this.showNotification('فشل في حذف الخبر', 'error');
            }
        }
    }

    resetForm(type) {
        document.getElementById(`${type}-form`).reset();
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.notificationArea.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// تهيئة مدير لوحة التحكم
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});
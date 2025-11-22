class AssignmentsManager {
    constructor() {
        this.assignmentsContainer = document.getElementById('assignments-container');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        this.filterSelect = document.getElementById('filter-select');
        
        this.init();
    }

    init() {
        this.loadAssignments();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.filterSelect.addEventListener('change', () => this.handleFilter());
    }

    getAssignments() {
        return JSON.parse(localStorage.getItem('assignments') || '[]');
    }

    async loadAssignments(searchTerm = '', filter = 'all') {
        this.showLoading(true);
        
        try {
            const assignments = this.getAssignments();
            this.displayAssignments(assignments, searchTerm, filter);
        } catch (error) {
            console.error('خطأ في تحميل الواجبات:', error);
            this.showError('فشل في تحميل الواجبات. يرجى المحاولة مرة أخرى.');
        } finally {
            this.showLoading(false);
        }
    }

    displayAssignments(assignments, searchTerm = '', filter = 'all') {
        this.assignmentsContainer.innerHTML = '';
        
        if (assignments.length === 0) {
            this.assignmentsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>لا توجد واجبات</h3>
                    <p>${searchTerm ? 'جرب مصطلح بحث مختلف' : 'لا توجد واجبات متاحة حالياً'}</p>
                </div>
            `;
            return;
        }

        // ترتيب الواجبات حسب تاريخ التسليم
        assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        const now = new Date();
        let hasVisibleAssignments = false;

        assignments.forEach((assignment) => {
            // تطبيق البحث
            if (searchTerm && !this.matchesSearch(assignment, searchTerm)) {
                return;
            }

            // تطبيق الفلتر
            const dueDate = new Date(assignment.dueDate);
            if (filter === 'upcoming' && dueDate < now) {
                return;
            }

            if (filter === 'overdue' && dueDate >= now) {
                return;
            }

            const assignmentElement = this.createAssignmentElement(assignment);
            this.assignmentsContainer.appendChild(assignmentElement);
            hasVisibleAssignments = true;
        });

        if (!hasVisibleAssignments) {
            this.assignmentsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>لا توجد واجبات تطابق معاييرك</h3>
                    <p>جرب تغيير إعدادات البحث أو الفلترة</p>
                </div>
            `;
        }
    }

    matchesSearch(assignment, searchTerm) {
        const term = searchTerm.toLowerCase();
        return assignment.title.toLowerCase().includes(term) || 
               assignment.description.toLowerCase().includes(term);
    }

    createAssignmentElement(assignment) {
        const assignmentDiv = document.createElement('div');
        assignmentDiv.className = 'assignment-card';
        
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
        const statusText = isOverdue ? 'متأخر' : 'موعد التسليم';

        assignmentDiv.innerHTML = `
            <div class="assignment-header">
                <h3 class="assignment-title">${assignment.title}</h3>
                <span class="assignment-due ${statusClass}">${statusText}: ${formattedDueDate}</span>
            </div>
            <div class="assignment-content">
                <p class="assignment-description">${assignment.description}</p>
            </div>
            <div class="assignment-footer">
                <span class="assignment-author">بواسطة: ${assignment.authorEmail}</span>
            </div>
        `;

        return assignmentDiv;
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        const filter = this.filterSelect.value;
        this.loadAssignments(searchTerm, filter);
    }

    handleFilter() {
        const searchTerm = this.searchInput.value.trim();
        const filter = this.filterSelect.value;
        this.loadAssignments(searchTerm, filter);
    }

    showLoading(show) {
        this.loadingSpinner.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        this.assignmentsContainer.innerHTML = `
            <div class="error-state">
                <h3>خطأ</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">إعادة المحاولة</button>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AssignmentsManager();
});
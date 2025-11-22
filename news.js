import { 
    db, 
    auth, 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    where,
    onAuthStateChanged,
    signOut
} from './firebase.js';

class NewsManager {
    constructor() {
        this.newsContainer = document.getElementById('news-container');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.searchInput = document.getElementById('search-input');
        this.searchBtn = document.getElementById('search-btn');
        
        this.init();
    }

    init() {
        this.loadNews();
        this.setupEventListeners();
        this.setupAuth();
    }

    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
    }

    setupAuth() {
        onAuthStateChanged(auth, (user) => {
            const adminLink = document.getElementById('admin-link');
            const userMenu = document.getElementById('user-menu');
            const loginLink = document.getElementById('login-nav-link');
            
            if (user) {
                loginLink.style.display = 'none';
                userMenu.style.display = 'block';
                // Check if user is admin (you'll need to implement this check)
                this.checkIfAdmin(user.uid).then(isAdmin => {
                    if (isAdmin && adminLink) {
                        adminLink.style.display = 'block';
                    }
                });
            } else {
                loginLink.style.display = 'block';
                userMenu.style.display = 'none';
                if (adminLink) adminLink.style.display = 'none';
            }
        });

        // Logout handler
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
        // Implement admin check based on your Firestore structure
        // This is a placeholder - you'll need to implement based on your admin system
        return false;
    }

    async loadNews(searchTerm = '') {
        this.showLoading(true);
        
        try {
            let newsQuery;
            if (searchTerm) {
                // Simple search - you might want to implement more sophisticated search
                newsQuery = query(
                    collection(db, 'news'),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );
            } else {
                newsQuery = query(
                    collection(db, 'news'),
                    orderBy('timestamp', 'desc'),
                    limit(50)
                );
            }

            const querySnapshot = await getDocs(newsQuery);
            this.displayNews(querySnapshot, searchTerm);
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError('Failed to load news. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    displayNews(querySnapshot, searchTerm = '') {
        this.newsContainer.innerHTML = '';
        
        if (querySnapshot.empty) {
            this.newsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No news found</h3>
                    <p>${searchTerm ? 'Try a different search term' : 'Check back later for updates'}</p>
                </div>
            `;
            return;
        }

        querySnapshot.forEach((doc) => {
            const news = doc.data();
            const newsElement = this.createNewsElement(news, doc.id);
            this.newsContainer.appendChild(newsElement);
        });
    }

    createNewsElement(news, id) {
        const newsDiv = document.createElement('div');
        newsDiv.className = 'news-card';
        
        const date = news.timestamp?.toDate?.() || new Date();
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let fileSection = '';
        if (news.fileURL) {
            fileSection = `
                <div class="news-file">
                    <a href="${news.fileURL}" target="_blank" class="file-link">
                        📎 Download Attachment
                    </a>
                </div>
            `;
        }

        newsDiv.innerHTML = `
            <div class="news-header">
                <h3 class="news-title">${news.title}</h3>
                <span class="news-date">${formattedDate}</span>
            </div>
            <div class="news-content">
                <p class="news-description">${news.description}</p>
                ${fileSection}
            </div>
            <div class="news-footer">
                <span class="news-author">By: ${news.authorEmail}</span>
            </div>
        `;

        return newsDiv;
    }

    handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        this.loadNews(searchTerm);
    }

    showLoading(show) {
        this.loadingSpinner.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        this.newsContainer.innerHTML = `
            <div class="error-state">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NewsManager();
});
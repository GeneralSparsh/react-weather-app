(function() {
    function checkAuthentication() {
        const session = localStorage.getItem('weatherAppSession');

        if (!session) {
            redirectToAuth();
            return false;
        }

        try {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();

            if (sessionData.expires <= now) {
                localStorage.removeItem('weatherAppSession');
                redirectToAuth();
                return false;
            }

            addLogoutButton(sessionData.user);
            return true;

        } catch (error) {
            console.error('Error checking authentication:', error);
            localStorage.removeItem('weatherAppSession');
            redirectToAuth();
            return false;
        }
    }

    function redirectToAuth() {
        window.location.href = 'auth.html';
    }

    function addLogoutButton(user) {
        const headerControls = document.querySelector('.header-controls');

        if (headerControls && !document.getElementById('logoutBtn')) {
            const userInfo = document.createElement('span');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `Welcome, ${user.username}`;
            userInfo.style.marginRight = '10px';
            userInfo.style.color = 'var(--color-text-secondary)';
            userInfo.style.fontSize = 'var(--font-size-sm)';

            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'btn btn--outline btn--sm';
            logoutBtn.innerHTML = '🚪 Logout';
            logoutBtn.onclick = logout;

            headerControls.insertBefore(userInfo, headerControls.firstChild);
            headerControls.insertBefore(logoutBtn, headerControls.firstChild);
        }
    }

    function logout() {
        localStorage.removeItem('weatherAppSession');
        window.location.href = 'auth.html';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuthentication);
    } else {
        checkAuthentication();
    }
})();

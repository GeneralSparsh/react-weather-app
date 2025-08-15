
class AuthApp {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkExistingSession();

        this.bindEvents();

        this.showScreen('loginScreen');
    }

    checkExistingSession() {
        const session = localStorage.getItem('weatherAppSession');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = new Date().getTime();

                if (sessionData.expires > now) {
                    this.currentUser = sessionData.user;
                    this.redirectToWeatherApp();
                    return;
                }
            } catch (error) {
                console.error('Error checking session:', error);
            }
        }

        localStorage.removeItem('weatherAppSession');
    }

    bindEvents() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');

        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', () => this.showScreen('registerScreen'));
        }

        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', () => this.showScreen('loginScreen'));
        }

        this.bindValidationEvents();
    }

    bindValidationEvents() {
        const loginUsername = document.getElementById('loginUsername');
        const loginPassword = document.getElementById('loginPassword');

        if (loginUsername) {
            loginUsername.addEventListener('blur', () => this.validateField(loginUsername, 'username'));
            loginUsername.addEventListener('input', () => this.clearFieldError(loginUsername));
        }

        if (loginPassword) {
            loginPassword.addEventListener('blur', () => this.validateField(loginPassword, 'password'));
            loginPassword.addEventListener('input', () => this.clearFieldError(loginPassword));
        }

        const registerUsername = document.getElementById('registerUsername');
        const registerPassword = document.getElementById('registerPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        if (registerUsername) {
            registerUsername.addEventListener('blur', () => this.validateField(registerUsername, 'newUsername'));
            registerUsername.addEventListener('input', () => this.clearFieldError(registerUsername));
        }

        if (registerPassword) {
            registerPassword.addEventListener('blur', () => this.validateField(registerPassword, 'password'));
            registerPassword.addEventListener('input', () => this.clearFieldError(registerPassword));
        }

        if (confirmPassword) {
            confirmPassword.addEventListener('blur', () => this.validatePasswordConfirmation());
            confirmPassword.addEventListener('input', () => this.clearFieldError(confirmPassword));
        }
    }

    showScreen(screenId) {
        const screens = document.querySelectorAll('.auth-screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        this.clearAllErrors();
    }

    async handleLogin(event) {
        event.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!this.validateLoginForm(username, password)) {
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        try {
            await this.delay(1000);

            const user = this.authenticateUser(username, password);

            if (user) {
                this.currentUser = user;
                this.createSession(user);
                this.showSuccess('Login successful! Redirecting...');

                setTimeout(() => {
                    this.redirectToWeatherApp();
                }, 1500);
            } else {
                this.showError(document.getElementById('loginPassword'), 'Invalid username or password');
            }

        } catch (error) {
            this.showError(document.getElementById('loginPassword'), 'Login failed. Please try again.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();

        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!this.validateRegisterForm(username, password, confirmPassword)) {
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        try {
            await this.delay(1000);

            if (this.userExists(username)) {
                this.showError(document.getElementById('registerUsername'), 'Username already exists');
                return;
            }

            const newUser = this.createUser(username, password);
            this.currentUser = newUser;
            this.createSession(newUser);

            this.showSuccess('Account created successfully! Redirecting...');

            setTimeout(() => {
                this.redirectToWeatherApp();
            }, 1500);

        } catch (error) {
            this.showError(document.getElementById('registerPassword'), 'Registration failed. Please try again.');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    validateLoginForm(username, password) {
        let isValid = true;

        if (!username) {
            this.showError(document.getElementById('loginUsername'), 'Username is required');
            isValid = false;
        }

        if (!password) {
            this.showError(document.getElementById('loginPassword'), 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError(document.getElementById('loginPassword'), 'Password must be at least 6 characters');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(username, password, confirmPassword) {
        let isValid = true;

        if (!username) {
            this.showError(document.getElementById('registerUsername'), 'Username is required');
            isValid = false;
        } else if (username.length < 3) {
            this.showError(document.getElementById('registerUsername'), 'Username must be at least 3 characters');
            isValid = false;
        }

        if (!password) {
            this.showError(document.getElementById('registerPassword'), 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError(document.getElementById('registerPassword'), 'Password must be at least 6 characters');
            isValid = false;
        }

        if (!confirmPassword) {
            this.showError(document.getElementById('confirmPassword'), 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showError(document.getElementById('confirmPassword'), 'Passwords do not match');
            isValid = false;
        }

        return isValid;
    }

    validateField(field, type) {
        const value = field.value.trim();

        switch (type) {
            case 'username':
                if (!value) {
                    this.showError(field, 'Username is required');
                } else {
                    this.showSuccess(field);
                }
                break;

            case 'newUsername':
                if (!value) {
                    this.showError(field, 'Username is required');
                } else if (value.length < 3) {
                    this.showError(field, 'Username must be at least 3 characters');
                } else if (this.userExists(value)) {
                    this.showError(field, 'Username already exists');
                } else {
                    this.showSuccess(field);
                }
                break;

            case 'password':
                if (!value) {
                    this.showError(field, 'Password is required');
                } else if (value.length < 6) {
                    this.showError(field, 'Password must be at least 6 characters');
                } else {
                    this.showSuccess(field);
                }
                break;
        }
    }

    validatePasswordConfirmation() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword');
        const confirmValue = confirmPassword.value;

        if (!confirmValue) {
            this.showError(confirmPassword, 'Please confirm your password');
        } else if (password !== confirmValue) {
            this.showError(confirmPassword, 'Passwords do not match');
        } else {
            this.showSuccess(confirmPassword);
        }
    }

    showError(field, message) {
        this.clearFieldError(field);

        field.classList.add('error');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;

        field.parentNode.appendChild(errorDiv);
    }

    showSuccess(fieldOrMessage) {
        if (typeof fieldOrMessage === 'string') {
            const existingMessage = document.querySelector('.success-message');
            if (existingMessage) {
                existingMessage.remove();
            }

            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = fieldOrMessage;

            const activeForm = document.querySelector('.auth-screen.active .auth-form');
            if (activeForm) {
                activeForm.appendChild(successDiv);
            }
        } else {
            this.clearFieldError(fieldOrMessage);
            fieldOrMessage.classList.add('success');
        }
    }

    clearFieldError(field) {
        field.classList.remove('error', 'success');

        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    clearAllErrors() {
        const errorMessages = document.querySelectorAll('.error-message, .success-message');
        errorMessages.forEach(msg => msg.remove());

        const errorFields = document.querySelectorAll('.error, .success');
        errorFields.forEach(field => {
            field.classList.remove('error', 'success');
        });
    }

    setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // user management
    loadUsers() {
        try {
            const users = localStorage.getItem('weatherAppUsers');
            return users ? JSON.parse(users) : [];
        } catch (error) {
            return [];
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('weatherAppUsers', JSON.stringify(this.users));
        } catch (error) {
            console.error('Error saving users:', error);
        }
    }

    userExists(username) {
        return this.users.some(user => user.username.toLowerCase() === username.toLowerCase());
    }

    createUser(username, password) {
        const newUser = {
            id: Date.now().toString(),
            username: username,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        this.saveUsers();

        return { ...newUser, password: undefined };
    }

    authenticateUser(username, password) {
        const user = this.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.password === this.hashPassword(password)
        );

        if (user) {
            return { ...user, password: undefined };
        }

        return null;
    }

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    createSession(user) {
        const sessionData = {
            user: user,
            expires: new Date().getTime() + (7 * 24 * 60 * 60 * 1000)
        };

        try {
            localStorage.setItem('weatherAppSession', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Error creating session:', error);
        }
    }

    logout() {
        localStorage.removeItem('weatherAppSession');
        this.currentUser = null;
        window.location.href = 'auth.html';
    }

    redirectToWeatherApp() {
        window.location.href = 'index.html';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AuthApp();
});

window.AuthApp = AuthApp;

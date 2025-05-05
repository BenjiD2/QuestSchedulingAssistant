import auth0 from 'auth0-js';

/**
 * Auth class for authentication with Auth0
 * Provides login, register, and user management functions
 */
export class Auth {
  constructor() {
    // For development - enables mock authentication mode
    this.devMode = false; // Using real Auth0 authentication
    
    // Log environment variables for debugging
    console.log('Auth0 initialization:');
    console.log('Domain:', process.env.REACT_APP_AUTH0_DOMAIN);
    console.log('ClientID:', process.env.REACT_APP_AUTH0_CLIENT_ID);
    console.log('Callback URL:', process.env.REACT_APP_AUTH0_CALLBACK_URL);
    
    // Store configuration values to prevent undefined errors
    this.domain = process.env.REACT_APP_AUTH0_DOMAIN || 'dev-ac5n5oprd0anql73.us.auth0.com';
    this.clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || '7c8z3UQJFNAR9Zbptrd99nR4h154Dcyj';
    this.callbackUrl = process.env.REACT_APP_AUTH0_CALLBACK_URL || 'http://localhost:3000/callback';
    
    try {
      // Initialize Auth0 client with simplified options
      this.auth0Client = new auth0.WebAuth({
        domain: this.domain,
        clientID: this.clientId,
        redirectUri: this.callbackUrl,
        responseType: 'token id_token',
        scope: 'openid profile email'
      });
      console.log('Auth0 client initialized successfully');
    } catch (error) {
      console.error('Error initializing Auth0 client:', error);
      this.auth0Client = null; // Prevent null reference errors
    }

    // Bind methods
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getUser = this.getUser.bind(this);
  }

  login() {
    if (this.devMode) {
      console.log('DEV MODE: Login clicked');
      // Mock successful login in dev mode
      localStorage.setItem('dev_authenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        name: 'Dev User',
        email: 'dev@example.com'
      }));
      window.location.href = '/';
      return;
    }
    
    // Redirect to Auth0 login page with simplified parameters
    console.log('LOGIN BUTTON CLICKED');
    console.log('Auth0 configured with:');
    console.log('- Domain:', this.domain);
    console.log('- ClientID:', this.clientId);
    console.log('- Callback URL:', this.callbackUrl);
    
    try {
      console.log('Attempting to call authorize()...');
      this.auth0Client.authorize({
        // Using the simple authorization approach
      });
      console.log('authorize() call completed - redirect should happen next');
    } catch (error) {
      console.error('AUTH0 LOGIN ERROR:', error);
      alert('Login failed. Check console for details.');
    }
  }

  register() {
    if (this.devMode) {
      console.log('DEV MODE: Register clicked');
      // Mock successful registration in dev mode
      localStorage.setItem('dev_authenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        name: 'New Dev User',
        email: 'newdev@example.com'
      }));
      window.location.href = '/';
      return;
    }
    
    // Redirect to Auth0 signup page
    console.log('Redirecting to Auth0 signup page...');
    
    try {
      this.auth0Client.authorize({
        redirectUrl: this.callbackUrl,
        mode: 'signUp'
      });
    } catch (error) {
      console.error('Auth0 register error:', error);
    }
  }

  handleAuthentication() {
    if (this.devMode) {
      return Promise.resolve({
        idTokenPayload: {
          name: 'Dev User',
          email: 'dev@example.com'
        }
      });
    }
    
    return new Promise((resolve, reject) => {
      this.auth0Client.parseHash((err, authResult) => {
        if (err) return reject(err);
        
        if (authResult && authResult.accessToken && authResult.idToken) {
          this.setSession(authResult);
          return resolve(authResult);
        }
      });
    });
  }

  setSession(authResult) {
    // Set the time that the access token will expire
    const expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );
    
    // Store authentication data
    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    
    // Store user profile
    if (authResult.idTokenPayload) {
      localStorage.setItem('user', JSON.stringify({
        name: authResult.idTokenPayload.name,
        email: authResult.idTokenPayload.email,
        picture: authResult.idTokenPayload.picture
      }));
    }
  }

  logout() {
    if (this.devMode) {
      console.log('DEV MODE: Logout clicked');
      localStorage.removeItem('dev_authenticated');
      localStorage.removeItem('user');
      window.location.href = '/';
      return;
    }
    
    // Clear access token and ID token from local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('user');
    
    // Navigate to the home route
    window.location.href = '/';
  }

  isAuthenticated() {
    if (this.devMode) {
      return localStorage.getItem('dev_authenticated') === 'true';
    }
    
    // Check if the current time is past the access token's expiry time
    const expiresAt = JSON.parse(localStorage.getItem('expires_at') || '0');
    return new Date().getTime() < expiresAt;
  }

  getUser() {
    // Get the user details from local storage
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
} 
const { auth } = require('express-openid-connect');
const { auth: auth0 } = require('express-openid-connect');

class Auth {
  constructor(req) {
    this.req = req;
  }

  isAuthenticated() {
    return !!(this.req && this.req.oidc && this.req.oidc.isAuthenticated());
  }

  async login() {
    // In a real app, redirect to Auth0 login
    if (this.req && this.req.oidc) {
      this.req.oidc.login();
    }
  }

  async register() {
    // Auth0 handles registration via hosted page
    if (this.req && this.req.oidc) {
      this.req.oidc.login({ authorizationParams: { screen_hint: 'signup' } });
    }
  }

  getUser() {
    if (this.req && this.req.oidc && this.req.oidc.user) {
      return this.req.oidc.user;
    }
    return null;
  }
}

module.exports = { Auth }; 
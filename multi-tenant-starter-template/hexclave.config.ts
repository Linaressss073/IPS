export const config = {
  "apps": {
    "installed": {
      "authentication": {
        "enabled": true
      },
      "api-keys": {
        "enabled": true
      },
      "emails": {
        "enabled": true
      },
      "webhooks": {
        "enabled": true
      },
      "analytics": {
        "enabled": true
      },
      "teams": {
        "enabled": true
      }
    }
  },
  "teams": {
    "allowClientTeamCreation": true
  },
  "auth": {
    "password": {
      "allowSignIn": false
    },
    "otp": {
      "allowSignIn": false
    },
    "passkey": {
      "allowSignIn": false
    },
    "oauth": {
      "providers": {
        "google": {
          "type": "google",
          "allowSignIn": true,
          "allowConnectedAccounts": true
        }
      }
    },
    "allowSignUp": true
  },
  "emails": {
    "selectedThemeId": "c7e2d94f-8a1b-4e6d-b3f5-9d0a2e7c1b8f"
  },
  "onboarding": {
    "requireEmailVerification": true
  }
};

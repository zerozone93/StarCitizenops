# Security Notes

- Local environment files such as `.env` and `.env.local` must never be committed.
- Only `.env.example` should be kept in version control as a template.
- If any local secret has been exposed during development, rotate that secret before any production deployment.

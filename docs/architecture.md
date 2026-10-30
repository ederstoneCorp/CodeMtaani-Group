# Platform Architecture

## Current phase: Public corporate website

The first release is a responsive corporate website built with Next.js App Router, TypeScript and Tailwind CSS.

### Application structure

- `src/app/`: routes, layouts and global styles.
- `public/`: static assets such as the brand mark, images and icons.
- `docs/`: architecture, governance and implementation documentation.

### Planned route groups

- `/`: corporate homepage.
- `/about`: organisation, mission, vision and values.
- `/divisions`: group divisions.
- `/services`: commercial services.
- `/products`: products and platforms.
- `/projects`: selected work and case studies.
- `/research`: research and innovation.
- `/insights`: articles and announcements.
- `/careers`: opportunities and talent community.
- `/contact`: enquiries and partnerships.

### Later platform capabilities

The authenticated Digital Workplace will be designed as a separate application area with server-side authentication, role-based access control, audit logging and secure data storage. It must not expose internal organisational records through public routes.

## Engineering requirements

- Keep secrets out of source control.
- Validate and rate-limit public forms.
- Use server-side validation for all trusted operations.
- Apply least-privilege access.
- Add automated tests as features are introduced.
- Document schema changes and deployment procedures.
- Use managed database and authentication services only after the requirements and provider have been reviewed.

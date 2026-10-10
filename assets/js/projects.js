    /* Editable identity and portfolio content. Every study is a system I built or ran. */
window.ARTIST={name:'Durrez Ahmed',initials:'da',description:'Software Engineer',contactURL:''};
// The physical card reverses and the accessible reading layout share this copy.
window.BIOGRAPHY=[
 {layout:'material',label:'My work / Systems in production',title:['Full stack.','In production.'],lead:'I build backends, real-time pipelines and the consoles that run them.',body:'A video platform watching 1,000+ cameras. A healthcare system serving 10,000 doctors. An AI analytics dashboard, a digital library, and the APIs underneath all of them. Different domains, same discipline: design the data, ship the service, keep it up.',specimen:{from:'A requirement on a whiteboard.',to:'A system someone relies on.'},foot:'Three years of production systems in Node.js and TypeScript.'},
 {layout:'manifesto',label:'How I work / Measure, then move',title:['Latency is','a decision.'],lead:'Every slow system is slow for a reason somebody chose.',body:'I profile before I touch anything, then change one thing at a time. API response times down 25%. Query execution down 30%. Stream latency down 40%. None of it was luck; it was reading the flags, the query plans and the transport settings nobody had read.',signature:'Durrez Ahmed',foot:'Profile first. Then change one thing.'},
 {layout:'practice',label:'My range / Backend to browser',title:['One engineer.','Whole stack.'],lead:'APIs and schemas taught me structure. Streaming taught me timing. React let me put the system in front of the people who use it.',body:'I design the data model, write the service, deploy it on AWS and then build the console people actually use to run it — for surveillance operators, hospital admins and librarians alike.',mediums:['Backends','Real-time','Interfaces'],foot:'Jaipur, India. Open to interesting systems.'}
];
window.PORTFOLIO=[
  {
    "id": "vms",
    "title": "A Thousand Streams",
    "category": "Enterprise video platform",
    "discipline": "Streams",
    "year": "System 01",
    "image": "01",
    "short": "A thousand cameras, held in one view.",
    "description": "Habile iYE — an enterprise Video Management System built from scratch: live monitoring, recording, playback, alerts, health monitoring and audit trails for 1,000+ cameras across 200+ sites.",
    "detail": "Deployed for 3 enterprise clients: ONGC (55 locations, failover), a State Government IT Centre (350+ cameras) and a leading NBFC (1,000+ cameras, 200+ sites).",
    "alt": "A grid of camera tiles with a sweep line across the live ones."
  },
  {
    "id": "aivision",
    "title": "What The Camera Saw",
    "category": "Real-time AI analytics",
    "discipline": "Streams",
    "year": "System 02",
    "image": "02",
    "short": "Inference, drawn over a live stream.",
    "description": "AI Vision Dashboard — a real-time analytics platform that runs detection on live streams and surfaces events to operators: theft, idle time, PPE compliance, age and gender estimation.",
    "detail": "Node.js, TypeScript, PostgreSQL, Redis and BullMQ absorbing high-frequency detection events; MediaMTX and WebRTC serving the live view.",
    "alt": "Detection brackets and confidence bars over an abstract scene."
  },
  {
    "id": "medtech",
    "title": "Ten Thousand Doctors",
    "category": "Healthcare platform",
    "discipline": "Systems",
    "year": "System 03",
    "image": "03",
    "short": "Appointments, verification and every Tuesday, forever.",
    "description": "Meet My Doctor — a production healthcare platform for appointment scheduling, doctor verification and organization administration, serving 10,000 doctors across 1,000+ specialties.",
    "detail": "Recurring-slot engine for daily, weekly and custom patterns. Express, PostgreSQL, Sequelize, Keycloak RBAC, AWS S3 and CI/CD.",
    "alt": "A calendar grid with repeating cells joined by curved trails."
  },
  {
    "id": "library",
    "title": "A Library, Lent Out",
    "category": "Full-stack product",
    "discipline": "Systems",
    "year": "System 04",
    "image": "04",
    "short": "Books, borrowers and the rules between them.",
    "description": "A full-stack digital library and book circulation platform: discovery, availability, borrowing and return workflows, due dates and overdue tracking on MongoDB Atlas.",
    "detail": "Mongoose schemas with references, validation and indexing; REST APIs in Express; a responsive React interface for search and circulation.",
    "alt": "A central node joined by curved links to a ring of satellites."
  },
  {
    "id": "performance",
    "title": "Faster, On Purpose",
    "category": "Performance engineering",
    "discipline": "Scale",
    "year": "System 05",
    "image": "05",
    "short": "Three systems, three measured wins.",
    "description": "Performance work across the stack: API response times down 25%, SQL query execution down 30%, video transport latency down 40% — each one profiled first, then changed one thing at a time.",
    "detail": "Query plans and stored procedures in MySQL and PostgreSQL. Redis in front of the slow paths. FFmpeg flags and TCP/UDP transport read line by line.",
    "alt": "Packet timing bars above a latency curve settling towards its floor."
  },
  {
    "id": "security",
    "title": "Who Gets In",
    "category": "Security & access",
    "discipline": "Systems",
    "year": "System 06",
    "image": "06",
    "short": "Every door accounted for.",
    "description": "Enterprise security across platforms: Keycloak SSO, role-based access control with granular permissions, 2FA, session management, IP-based restrictions and full audit trails.",
    "detail": "The same access model protects surveillance operators, hospital admins and organization owners — three roles, one honest permission system.",
    "alt": "Events narrowing through a funnel toward a single checked entry."
  },
  {
    "id": "consoles",
    "title": "The Console They Trust",
    "category": "Frontend engineering",
    "discipline": "Systems",
    "year": "System 07",
    "image": "07",
    "short": "The system, put in front of someone.",
    "description": "React interfaces for the people who run the systems: admin panels for doctors, patients and organizations; surveillance operations consoles; analytics dashboards with live charts and event detail.",
    "detail": "React, Redux and Next.js over documented REST APIs. A backend is only finished when an operator can use it without asking.",
    "alt": "Layered interface planes stepping back in perspective."
  },
  {
    "id": "cloud",
    "title": "Certified On The Cloud",
    "category": "Certifications",
    "discipline": "Scale",
    "year": "System 08",
    "image": "08",
    "short": "AWS Certified AI Practitioner. Oracle Cloud Database Service Professional.",
    "description": "AWS Certified AI Practitioner, issued 27 September 2026, valid to 27 September 2029. Oracle Cloud Database Service Professional alongside it, and a Fast Starter Award from HabileLabs.",
    "detail": "Verify at aws.amazon.com/verification — validation number b68a5cae73964cc2b71a43698aa9bc3e.",
    "alt": "A hexagonal certification badge over ruled certificate lines."
  }
];

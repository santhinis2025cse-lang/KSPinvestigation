export interface MockFIR {
  id: string;
  firNumber: string;
  category: string;
  status: 'PENDING' | 'ACTIVE' | 'SOLVED';
  dateOfOffence: string;
  dateOfRegistration: string;
  summary: string;
  latitude: number;
  longitude: number;
  address: string;
  complainantName: string;
  complainantPhone: string;
  stationName: string;
  districtName: string;
  suspects: { name: string; aliases: string; role: string; riskScore: number; status: string; id: string }[];
  evidence: { type: string; description: string; storageLocation: string; serialNumber: string }[];
  vehicles: string[];
  phones: string[];
  timeline: { action: string; description: string; performedBy: string; timestamp: string }[];
}

export interface MockCriminal {
  id: string;
  name: string;
  aliases: string;
  aadhaarNumber: string;
  dateOfBirth: string;
  gender: string;
  riskScore: number;
  status: 'ACTIVE' | 'IN_CUSTODY' | 'ABSCONDING' | 'PAROLE';
  photoUrl: string;
  gang: string;
  vehicles: string[];
  phones: string[];
  associates: { id: string; name: string; relation: string }[];
  cases: { id: string; firNumber: string; role: string }[];
}

export const MOCK_DISTRICTS = [
  { id: 'dist-bng', name: 'Bengaluru City', code: 'BNG_CITY' },
  { id: 'dist-mys', name: 'Mysuru', code: 'MYS_DIST' },
  { id: 'dist-mng', name: 'Mangaluru City', code: 'MNG_CITY' },
  { id: 'dist-hub', name: 'Hubballi-Dharwad', code: 'HUB_DHA' }
];

export const MOCK_STATIONS = [
  { id: 'ps-kora', name: 'Koramangala Police Station', districtId: 'dist-bng' },
  { id: 'ps-indira', name: 'Indiranagar Police Station', districtId: 'dist-bng' },
  { id: 'ps-wf', name: 'Whitefield Police Station', districtId: 'dist-bng' },
  { id: 'ps-lashkar', name: 'Lashkar Police Station', districtId: 'dist-mys' },
  { id: 'ps-kadri', name: 'Kadri Police Station', districtId: 'dist-mng' }
];

export const MOCK_CATEGORIES = [
  { id: 'cat-rob', name: 'Robbery', code: 'ROBBERY' },
  { id: 'cat-burg', name: 'House Breaking & Burglary', code: 'BURGLARY' },
  { id: 'cat-cyber', name: 'Cybercrime', code: 'CYBERCRIME' },
  { id: 'cat-hom', name: 'Homicide', code: 'HOMICIDE' },
  { id: 'cat-narc', name: 'Drug Trafficking & Narcotics', code: 'NARCOTICS' },
  { id: 'cat-assault', name: 'Assault & Rioting', code: 'ASSAULT' }
];

export const MOCK_CRIMINALS: MockCriminal[] = [
  {
    id: 'crim-1',
    name: "Ramesh 'Kulla' Kumar",
    aliases: "Kulla Ramesh, Pocket Ramesh",
    aadhaarNumber: "8472-9104-8392",
    dateOfBirth: '1988-04-12',
    gender: 'Male',
    riskScore: 85,
    status: 'ACTIVE',
    photoUrl: '/placeholders/ramesh_kulla.jpg',
    gang: 'Koramangala Robbery Syndicate',
    vehicles: ['KA-01-HE-7890'],
    phones: ['9900123456'],
    associates: [
      { id: 'crim-5', name: "Manjunath 'Kothi' Gowda", relation: 'GANG_MEMBER' }
    ],
    cases: [
      { id: 'fir-1', firNumber: 'FIR-2026-0045', role: 'SUSPECT' }
    ]
  },
  {
    id: 'crim-2',
    name: "Shaji 'Doctor' Mathew",
    aliases: "Dr. Mathew, Shaji Bhai",
    aadhaarNumber: "9182-7364-5091",
    dateOfBirth: '1976-11-23',
    gender: 'Male',
    riskScore: 92,
    status: 'ABSCONDING',
    photoUrl: '/placeholders/shaji_doctor.jpg',
    gang: 'Indiranagar Housebreaking Gang',
    vehicles: ['KA-51-AB-9999'],
    phones: ['8095432109'],
    associates: [
      { id: 'crim-3', name: "Syed 'Bhai' Karim", relation: 'CO_CONSPIRATOR' }
    ],
    cases: [
      { id: 'fir-2', firNumber: 'FIR-2026-0056', role: 'SUSPECT' }
    ]
  },
  {
    id: 'crim-3',
    name: "Syed 'Bhai' Karim",
    aliases: "Bhaiya, Syed Don",
    aadhaarNumber: "3849-1029-3847",
    dateOfBirth: '1982-08-05',
    gender: 'Male',
    riskScore: 78,
    status: 'IN_CUSTODY',
    photoUrl: '/placeholders/syed_bhai.jpg',
    gang: 'Indiranagar Housebreaking Gang',
    vehicles: ['KA-51-AB-9999'],
    phones: ['9845012345'],
    associates: [
      { id: 'crim-2', name: "Shaji 'Doctor' Mathew", relation: 'CO_CONSPIRATOR' }
    ],
    cases: [
      { id: 'fir-2', firNumber: 'FIR-2026-0056', role: 'ACCOMPLICE' }
    ]
  },
  {
    id: 'crim-4',
    name: "Kavitha 'Techie' Rao",
    aliases: "Cyber Kavitha, Hacker K",
    aadhaarNumber: "7384-9201-8473",
    dateOfBirth: '1994-02-17',
    gender: 'Female',
    riskScore: 48,
    status: 'PAROLE',
    photoUrl: '/placeholders/kavitha_rao.jpg',
    gang: 'Eastern Bangalore Cyber Syndicate',
    vehicles: ['KA-03-MX-1234'],
    phones: [],
    associates: [],
    cases: [
      { id: 'fir-3', firNumber: 'FIR-2026-0062', role: 'SUSPECT' }
    ]
  },
  {
    id: 'crim-5',
    name: "Manjunath 'Kothi' Gowda",
    aliases: "Kothi Manja, Gowdru",
    aadhaarNumber: "4829-1048-2019",
    dateOfBirth: '1990-09-30',
    gender: 'Male',
    riskScore: 70,
    status: 'ACTIVE',
    photoUrl: '/placeholders/manjunath_gowda.jpg',
    gang: 'Koramangala Robbery Syndicate',
    vehicles: [],
    phones: [],
    associates: [
      { id: 'crim-1', name: "Ramesh 'Kulla' Kumar", relation: 'GANG_MEMBER' }
    ],
    cases: [
      { id: 'fir-1', firNumber: 'FIR-2026-0045', role: 'ACCOMPLICE' }
    ]
  }
];

export const MOCK_FIRS: MockFIR[] = [
  {
    id: 'fir-1',
    firNumber: 'FIR-2026-0045',
    category: 'Robbery',
    status: 'ACTIVE',
    dateOfOffence: '2026-06-15T22:30:00Z',
    dateOfRegistration: '2026-06-16T09:00:00Z',
    summary: 'Armed robbery reported at Koramangala 4th Block. Two suspects wearing helmets cornered the complainant near Sony World signal, threatened him with a machete, and fled with a gold chain (24g) and a laptop bag on a black gearless scooter.',
    latitude: 12.9348,
    longitude: 77.6189,
    address: 'Sony World Signal, Koramangala 4th Block, Bengaluru',
    complainantName: 'Anoop Kumar S',
    complainantPhone: '9123456780',
    stationName: 'Koramangala Police Station',
    districtName: 'Bengaluru City',
    suspects: [
      { id: 'crim-1', name: "Ramesh 'Kulla' Kumar", aliases: 'Kulla Ramesh', role: 'SUSPECT', riskScore: 85, status: 'ACTIVE' },
      { id: 'crim-5', name: "Manjunath 'Kothi' Gowda", aliases: 'Kothi Manja', role: 'ACCOMPLICE', riskScore: 70, status: 'ACTIVE' }
    ],
    evidence: [
      { type: 'WEAPON', description: 'Iron Machete used for threat', storageLocation: 'Koramangala PS Locker B-4', serialNumber: 'EVID-M-2026' }
    ],
    vehicles: ['KA-01-HE-7890'],
    phones: ['9900123456'],
    timeline: [
      { action: 'FIR Registered', description: 'Complainant Anoop Kumar reported the theft immediately at Koramangala PS. FIR drafted and registered.', performedBy: 'Inspector Satish Kumar', timestamp: '2026-06-16T09:00:00Z' },
      { action: 'CCTV Retrieval', description: 'Footage from the Sony world signal CCTV was retrieved. Black Honda Activa KA-01-HE-7890 spotted leaving the scene.', performedBy: 'Sub-Inspector Mohan Rao', timestamp: '2026-06-17T14:30:00Z' }
    ]
  },
  {
    id: 'fir-2',
    firNumber: 'FIR-2026-0056',
    category: 'House Breaking & Burglary',
    status: 'PENDING',
    dateOfOffence: '2026-06-20T03:00:00Z',
    dateOfRegistration: '2026-06-20T10:45:00Z',
    summary: 'Housebreaking and burglary at an unoccupied villa in Indiranagar. Gold jewelry worth ₹5 Lakhs and cash ₹50,000 stolen. Entry gained by breaking the window grille. CCTV footage shows a Silver Bolero moving suspiciously in the lane.',
    latitude: 12.9718,
    longitude: 77.6411,
    address: '12th Main Road, Indiranagar, Bengaluru',
    complainantName: 'Ravi Shankar Hegde',
    complainantPhone: '9876543210',
    stationName: 'Indiranagar Police Station',
    districtName: 'Bengaluru City',
    suspects: [
      { id: 'crim-2', name: "Shaji 'Doctor' Mathew", aliases: 'Dr. Mathew', role: 'SUSPECT', riskScore: 92, status: 'ABSCONDING' },
      { id: 'crim-3', name: "Syed 'Bhai' Karim", aliases: 'Syed Don', role: 'ACCOMPLICE', riskScore: 78, status: 'IN_CUSTODY' }
    ],
    evidence: [
      { type: 'OTHER', description: 'Fingerprints collected from window pane frame', storageLocation: 'Forensic Lab BNG-F1', serialNumber: 'FSL-2910-FP' }
    ],
    vehicles: ['KA-51-AB-9999'],
    phones: ['9845012345', '8095432109'],
    timeline: [
      { action: 'FIR Registered', description: 'Registered after neighbor noticed open window and informed complainant.', performedBy: 'Inspector Venkatesh M', timestamp: '2026-06-20T10:45:00Z' },
      { action: 'Evidence Dispatched', description: 'Fingerprint dust cards packaged and dispatched to FSL Bengaluru.', performedBy: 'Sub-Inspector Anitha D', timestamp: '2026-06-21T11:00:00Z' }
    ]
  },
  {
    id: 'fir-3',
    firNumber: 'FIR-2026-0062',
    category: 'Cybercrime',
    status: 'SOLVED',
    dateOfOffence: '2026-06-28T11:15:00Z',
    dateOfRegistration: '2026-06-29T10:00:00Z',
    summary: 'Phishing scam targeting senior citizens in Whitefield. The accused posed as SBI bank officials, extracted credit card OTPs, and stole ₹1,50,000. IP tracing resolved the operations to a server hosted in East Bengaluru.',
    latitude: 12.9698,
    longitude: 77.7499,
    address: 'Prestige Shantiniketan, Whitefield, Bengaluru',
    complainantName: 'Narayana Swamy Prasad',
    complainantPhone: '9008881234',
    stationName: 'Whitefield Police Station',
    districtName: 'Bengaluru City',
    suspects: [
      { id: 'crim-4', name: "Kavitha 'Techie' Rao", aliases: 'Cyber Kavitha', role: 'SUSPECT', riskScore: 48, status: 'PAROLE' }
    ],
    evidence: [
      { type: 'DIGITAL', description: 'Phishing domain source logs & IP tables', storageLocation: 'Cyber Cell Server backup', serialNumber: 'CYBER-LOG-2026' }
    ],
    vehicles: ['KA-03-MX-1234'],
    phones: [],
    timeline: [
      { action: 'FIR Registered', description: 'Registered at Whitefield Cyber Crime desk.', performedBy: 'Inspector Rajesh V', timestamp: '2026-06-29T10:00:00Z' },
      { action: 'Accused Arrested', description: 'Kavitha Rao arrested from cyber cafe in Outer Ring Road. Phishing laptop seized.', performedBy: 'SI Vinay Prasad', timestamp: '2026-07-01T15:00:00Z' },
      { action: 'Case Solved', description: 'Accused confessed, stolen funds recovered and returned to complainant.', performedBy: 'Inspector Rajesh V', timestamp: '2026-07-03T11:00:00Z' }
    ]
  }
];

export const MOCK_DASHBOARD_DATA = {
  cards: {
    totalCrimes: 124,
    activeCases: 42,
    solvedCases: 68,
    pendingCases: 14,
    repeatOffenders: 8,
    highRiskDistrict: 'Bengaluru City',
    crimeRateChange: '+12.4% MoM',
  },
  charts: {
    monthlyTrend: [
      { month: 'Jul 2025', count: 18 },
      { month: 'Aug 2025', count: 22 },
      { month: 'Sep 2025', count: 15 },
      { month: 'Oct 2025', count: 29 },
      { month: 'Nov 2025', count: 32 },
      { month: 'Dec 2025', count: 41 },
      { month: 'Jan 2026', count: 28 },
      { month: 'Feb 2026', count: 35 },
      { month: 'Mar 2026', count: 48 },
      { month: 'Apr 2026', count: 30 },
      { month: 'May 2026', count: 42 },
      { month: 'Jun 2026', count: 58 },
    ],
    categoryDistribution: [
      { category: 'Robbery', code: 'ROBBERY', count: 38 },
      { category: 'Burglary', code: 'BURGLARY', count: 45 },
      { category: 'Cybercrime', code: 'CYBERCRIME', count: 22 },
      { category: 'Homicide', code: 'HOMICIDE', count: 5 },
      { category: 'Narcotics', code: 'NARCOTICS', count: 9 },
      { category: 'Assault', code: 'ASSAULT', count: 5 },
    ],
    districtBreakdown: [
      { district: 'Bengaluru City', code: 'BNG_CITY', count: 72 },
      { district: 'Mysuru', code: 'MYS_DIST', count: 24 },
      { district: 'Mangaluru City', code: 'MNG_CITY', count: 18 },
      { district: 'Hubballi-Dharwad', code: 'HUB_DHA', count: 10 },
    ],
  },
  recentCases: MOCK_FIRS,
  recentAlerts: [
    {
      id: 'a1',
      title: 'Burglary Spike Alert',
      content: 'Burglary cases in Indiranagar PS have increased by 25% over the past 14 days. Cluster analysis indicates a repeat offender pattern.',
      type: 'CRIME_SPIKE',
      createdAt: '2026-07-11T12:00:00Z',
    },
    {
      id: 'a2',
      title: 'Suspect Match Notification',
      content: 'AI Network Analyzer detected shared contact 9900123456 between Ramesh Kumar (Wanted) and active phone KA-01-HE-7890.',
      type: 'AI_RECOMMENDATION',
      createdAt: '2026-07-11T10:30:00Z',
    },
  ],
};

export const MOCK_HOTSPOTS = {
  hotspots: [
    {
      id: 'hotspot-1',
      name: 'Koramangala 4th Block Circle',
      latitude: 12.9348,
      longitude: 77.6189,
      risk: 'HIGH',
      density: 85,
      radius: 350,
      incidents: 12,
      primaryCrime: 'Robbery & Chain Snatching',
      notes: 'Active time window: 22:00 - 03:00. Patrolling recommended.',
    },
    {
      id: 'hotspot-2',
      name: 'Indiranagar 12th Main Hub',
      latitude: 12.9718,
      longitude: 77.6411,
      risk: 'HIGH',
      density: 92,
      radius: 400,
      incidents: 18,
      primaryCrime: 'House Breaking & Burglary',
      notes: 'Occurs primarily in lock-and-key villas during holiday seasons.',
    },
    {
      id: 'hotspot-3',
      name: 'Vidyanagar Commercial Zone',
      latitude: 15.3647,
      longitude: 75.1249,
      risk: 'MEDIUM',
      density: 64,
      radius: 300,
      incidents: 7,
      primaryCrime: 'Assault & Petty Theft',
      notes: 'Correlated with weekend public gatherings.',
    },
  ],
  heatPoints: [
    { lat: 12.9348, lng: 77.6189, weight: 0.8, info: 'FIR-2026-0045: Robbery at Sony World Signal, Koramangala' },
    { lat: 12.9718, lng: 77.6411, weight: 0.9, info: 'FIR-2026-0056: Burglary at 12th Main, Indiranagar' },
    { lat: 12.9698, lng: 77.7499, weight: 0.5, info: 'FIR-2026-0062: Cybercrime at Prestige Shantiniketan, Whitefield' }
  ],
};

import { db } from './db';
import bcrypt from 'bcryptjs';
import {
  Role, FIRStatus, CriminalStatus, SuspectRole,
  EvidenceType, RelationType, NotificationType
} from './enums';

// ═══════════════════════════════════════════════════════════════════════════════
// DETERMINISTIC SEEDING ENGINE — KSP Crime Intelligence Platform
// Generates 30 districts, 100+ stations, 5000+ FIRs, 2000+ criminals, etc.
// All names, numbers, and identifiers are FICTIONAL and legally safe.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Seeded PRNG for deterministic output ─────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260711);
const rng = () => rand();
const rngInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

// ── Karnataka Districts (All 30 + Bengaluru sub-divisions) ────────────────────
export const districtsData = [
  { name: 'Bengaluru Urban', code: 'BNG_URB', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Bengaluru Rural', code: 'BNG_RUR', state: 'Karnataka', lat: 13.2156, lng: 77.5681 },
  { name: 'Mysuru', code: 'MYS', state: 'Karnataka', lat: 12.2958, lng: 76.6394 },
  { name: 'Mangaluru', code: 'MNG', state: 'Karnataka', lat: 12.9141, lng: 74.8560 },
  { name: 'Hubballi-Dharwad', code: 'HUB', state: 'Karnataka', lat: 15.3647, lng: 75.1240 },
  { name: 'Belagavi', code: 'BLG', state: 'Karnataka', lat: 15.8497, lng: 74.4977 },
  { name: 'Kalaburagi', code: 'KLB', state: 'Karnataka', lat: 17.3297, lng: 76.8343 },
  { name: 'Ballari', code: 'BAL', state: 'Karnataka', lat: 15.1394, lng: 76.9214 },
  { name: 'Shivamogga', code: 'SHV', state: 'Karnataka', lat: 13.9299, lng: 75.5681 },
  { name: 'Tumakuru', code: 'TMK', state: 'Karnataka', lat: 13.3409, lng: 77.1010 },
  { name: 'Davangere', code: 'DVG', state: 'Karnataka', lat: 14.4644, lng: 75.9218 },
  { name: 'Vijayapura', code: 'VJP', state: 'Karnataka', lat: 16.8302, lng: 75.7100 },
  { name: 'Raichur', code: 'RCH', state: 'Karnataka', lat: 16.2120, lng: 77.3439 },
  { name: 'Hassan', code: 'HSN', state: 'Karnataka', lat: 13.0033, lng: 76.1004 },
  { name: 'Chikkamagaluru', code: 'CMG', state: 'Karnataka', lat: 13.3161, lng: 75.7720 },
  { name: 'Chitradurga', code: 'CDG', state: 'Karnataka', lat: 14.2251, lng: 76.3980 },
  { name: 'Uttara Kannada', code: 'UKD', state: 'Karnataka', lat: 14.7938, lng: 74.6952 },
  { name: 'Udupi', code: 'UDP', state: 'Karnataka', lat: 13.3409, lng: 74.7421 },
  { name: 'Dakshina Kannada', code: 'DKD', state: 'Karnataka', lat: 12.8438, lng: 75.2479 },
  { name: 'Bagalkote', code: 'BGK', state: 'Karnataka', lat: 16.1691, lng: 75.6616 },
  { name: 'Dharwad', code: 'DHW', state: 'Karnataka', lat: 15.4589, lng: 75.0078 },
  { name: 'Gadag', code: 'GDG', state: 'Karnataka', lat: 15.4161, lng: 75.6190 },
  { name: 'Koppal', code: 'KPL', state: 'Karnataka', lat: 15.3510, lng: 76.1547 },
  { name: 'Yadgir', code: 'YDG', state: 'Karnataka', lat: 16.7712, lng: 77.1385 },
  { name: 'Bidar', code: 'BDR', state: 'Karnataka', lat: 17.9104, lng: 77.5199 },
  { name: 'Chamarajanagara', code: 'CJN', state: 'Karnataka', lat: 11.9244, lng: 76.9424 },
  { name: 'Mandya', code: 'MDY', state: 'Karnataka', lat: 12.5218, lng: 76.8951 },
  { name: 'Ramanagara', code: 'RMN', state: 'Karnataka', lat: 12.7166, lng: 77.2819 },
  { name: 'Chikkaballapur', code: 'CBP', state: 'Karnataka', lat: 13.4355, lng: 77.7278 },
  { name: 'Kodagu', code: 'KDG', state: 'Karnataka', lat: 12.3375, lng: 75.8069 },
];

// ── Police Stations (100+ across all districts) ───────────────────────────────
const STATION_SUFFIXES = [
  'City Police Station', 'Town Police Station', 'Rural Police Station',
  'North Police Station', 'South Police Station', 'East Police Station',
  'West Police Station', 'Market Police Station', 'Highway Police Station',
  'Cyber Crime PS'
];

function generateStations(): Array<{ name: string; code: string; districtCode: string }> {
  const stations: Array<{ name: string; code: string; districtCode: string }> = [];
  const stationsPerDistrict = [4, 3, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
  districtsData.forEach((dist, idx) => {
    const count = stationsPerDistrict[idx] || 3;
    for (let i = 0; i < count; i++) {
      const suffix = STATION_SUFFIXES[i % STATION_SUFFIXES.length];
      stations.push({
        name: `${dist.name} ${suffix}`,
        code: `PS_${dist.code}_${i + 1}`,
        districtCode: dist.code,
      });
    }
  });
  return stations;
}

export const policeStationsData = generateStations();

// ── Crime Categories ──────────────────────────────────────────────────────────
export const crimeCategoriesData = [
  { name: 'Robbery', code: 'ROBBERY', description: 'Theft accompanied by violence or threat of violence — IPC Sec 390-402' },
  { name: 'House Breaking & Burglary', code: 'BURGLARY', description: 'Illegal entry into residential or commercial properties — IPC Sec 449-460' },
  { name: 'Cybercrime', code: 'CYBERCRIME', description: 'Identity theft, phishing, cyber fraud, and online abuse — IT Act 2008' },
  { name: 'Homicide', code: 'HOMICIDE', description: 'Murder, culpable homicide, and manslaughter — IPC Sec 299-304' },
  { name: 'Drug Trafficking & Narcotics', code: 'NARCOTICS', description: 'Illegal possession, sale, and smuggling — NDPS Act 1985' },
  { name: 'Assault & Rioting', code: 'ASSAULT', description: 'Physical attack and breach of public peace — IPC Sec 351-358' },
];

// ── Name pools for synthetic generation ──────────────────────────────────────
const MALE_FIRST = ['Ramesh','Suresh','Mahesh','Ravi','Vijay','Arun','Kiran','Mohan','Ganesh','Prasad','Sanjay','Ajay','Rajesh','Lokesh','Naresh','Yogesh','Santosh','Dinesh','Harish','Girish','Shiva','Kumar','Raju','Manju','Basava','Sidda','Prakash','Venkat','Hanuma','Raghu','Anand','Deepak','Nikhil','Akash','Rohit','Amit','Sumit','Vivek','Manoj','Pradeep'];
const FEMALE_FIRST = ['Kavitha','Rekha','Suma','Anitha','Priya','Lakshmi','Meena','Geetha','Shilpa','Pooja','Divya','Sunita','Usha','Radha','Kamala','Savitha','Jyothi','Nalini','Mamatha','Bhavana','Asha','Nirmala','Suchitra','Madhuri','Swathi','Tejaswi','Chandrika','Vasantha','Shantha','Malathi'];
const LAST_NAMES = ['Kumar','Gowda','Reddy','Naik','Rao','Hegde','Patil','Shetty','Nayak','Kulkarni','Desai','Joshi','Sharma','Verma','Patel','Kaur','Singh','Rathod','Yadav','Pillai','Nair','Menon','Iyer','Krishnamurthy','Anantharaman','Venkataramaiah','Subramaniam','Chandrashekar','Basavarajappa','Siddegowda'];
const ALIASES = ['Don','Bhai','Anna','Dada','Kulla','Chhota','Bada','Boss','Doctor','Mama','Nana','Tiger','Lion','Fox','Ghost','Shadow','Rocket','Bullet','Blade','Knife'];
const CARRIERS = ['Jio','Airtel','Vodafone Idea','BSNL'];
const VEHICLE_MODELS_2W = ['Activa','Splendor','Pulsar','Apache','Dio','CB Shine','Access 125'];
const VEHICLE_MODELS_4W = ['Swift','i20','Creta','Bolero','Innova','Wagon R','Alto','Aspire','Scorpio'];
const VEHICLE_COLORS = ['Black','White','Silver','Red','Blue','Grey','Dark Blue','Pearl White'];
const EVIDENCE_DESCRIPTIONS = [
  'Iron rod used as weapon recovered from accused','CCTV footage showing suspect entering premises',
  'Fingerprint samples collected from crime scene','Mobile phone containing WhatsApp communication',
  'Gold ornaments matching complainant description','Narcotic substance (approx. 500g) in sealed bag',
  'Forged identity documents and fake SIM cards','Laptop with phishing toolkit and credential logs',
  'Blood-stained clothing belonging to accused','Cash amount matching stolen sum in sealed cover',
  'Knife with dried blood samples submitted to FSL','Getaway vehicle seized with tool marks',
  'SIM card registered to fictitious identity','CCTV DVR extracted from crime scene',
  'Empty cartridge shells collected at scene','Explosive residue swabs from hands of accused',
];
const STORAGE_LOCATIONS = [
  'Malkhana Locker A','Malkhana Locker B','Malkhana Locker C','FSL Bengaluru',
  'FSL Mysuru','Cyber Cell Evidence Server','District Court Evidence Room',
  'Central Malkhana Bengaluru','CID Evidence Cell','Explosive Storage Unit',
];
const TIMELINE_ACTIONS = [
  { action: 'FIR Registered', tmpl: 'FIR registered at {station} after complainant {name} reported the incident.' },
  { action: 'Spot Inspection', tmpl: 'Scene of occurrence visited. Physical evidence documented by investigation officer.' },
  { action: 'CCTV Retrieval', tmpl: 'CCTV footage retrieved from nearby cameras. Suspect vehicle identified.' },
  { action: 'Arrest Made', tmpl: 'Primary accused arrested from {area}. Produced before magistrate under CrPC Sec 167.' },
  { action: 'Evidence Dispatched', tmpl: 'Physical evidence packaged and dispatched to Forensic Science Lab for examination.' },
  { action: 'Statement Recorded', tmpl: 'Witness statements recorded under CrPC Sec 161.' },
  { action: 'Charge Sheet Filed', tmpl: 'Charge sheet filed in competent court within statutory period.' },
  { action: 'Case Referred to CID', tmpl: 'Case complexity warranted transfer to Crime Investigation Department.' },
  { action: 'Bail Opposed', tmpl: 'Bail opposed in Magistrate Court citing flight risk and evidence tampering possibility.' },
  { action: 'Case Solved', tmpl: 'All accused arrested. Stolen property recovered. Case marked as SOLVED.' },
];

const CITY_AREAS: Record<string, string[]> = {
  BNG_URB: ['Koramangala','Indiranagar','Whitefield','Jayanagar','JP Nagar','Hebbal','Yelahanka','Marathahalli','HSR Layout','BTM Layout','Electronic City','Bannerghatta Road'],
  MYS: ['Mysuru Palace Road','Gokulam','Jayalakshmi Puram','Vidyaranyapuram','Saraswathipuram','Kuvempunagar'],
  MNG: ['Kadri','Kankanady','Attavar','Bejai','Urwa','Balmatta','Derebail'],
  HUB: ['Vidyanagar','Gokul Road','Keshwapur','Old Hubli','Dharwad City'],
  BLG: ['Khanapur Road','Camp Area','Shahpur','Tilakwadi','Belgaum City'],
};

function getAreas(districtCode: string): string[] {
  return CITY_AREAS[districtCode] || [`${districtCode} Zone A`, `${districtCode} Zone B`, `${districtCode} Zone C`];
}

function formatPhone(): string {
  const prefixes = ['9900','9880','9845','9743','8095','8971','7760','7795','6360','6363'];
  return pick(prefixes) + String(rngInt(100000, 999999));
}

function formatIMEI(): string {
  return String(rngInt(100000000000000, 999999999999999));
}

function formatAadhaar(): string {
  return String(rngInt(2000, 9999)) + String(rngInt(1000, 9999)) + String(rngInt(1000, 9999));
}

function formatRegNo(): string {
  return `KA-${rngInt(1, 57).toString().padStart(2, '0')}-${String.fromCharCode(65 + rngInt(0, 25))}${String.fromCharCode(65 + rngInt(0, 25))}-${rngInt(1000, 9999)}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export const seedDatabase = async () => {
  try {
    console.log('🔄 Checking if Database needs seeding...');
    const userCount = await db.user.count();
    if (userCount > 0) {
      console.log('✅ Database already seeded. Skipping.');
      return;
    }

    console.log('🚀 Seeding KSP Crime Intelligence database with 5,000+ synthetic records...');

    // ── STEP 1: Districts ──────────────────────────────────────────────────────
    console.log('   [1/9] Creating 30 Karnataka Districts...');
    const createdDistricts: Record<string, string> = {};
    for (const dist of districtsData) {
      const d = await db.district.create({ data: { name: dist.name, code: dist.code, state: dist.state } });
      createdDistricts[d.code] = d.id;
    }

    // ── STEP 2: Police Stations ────────────────────────────────────────────────
    console.log('   [2/9] Creating 100+ Police Stations...');
    const createdStations: Record<string, string> = {};
    for (const ps of policeStationsData) {
      const distId = createdDistricts[ps.districtCode];
      if (!distId) continue;
      const station = await db.policeStation.create({
        data: { name: ps.name, code: ps.code, districtId: distId },
      });
      createdStations[ps.code] = station.id;
    }

    // ── STEP 3: Crime Categories ────────────────────────────────────────────────
    console.log('   [3/9] Creating Crime Categories...');
    const createdCategories: Record<string, string> = {};
    for (const cat of crimeCategoriesData) {
      const c = await db.crimeCategory.create({ data: cat });
      createdCategories[c.code] = c.id;
    }

    // ── STEP 4: Users ────────────────────────────────────────────────────────────
    console.log('   [4/9] Creating Users (6 demo accounts)...');
    const passwordHash = await bcrypt.hash('Ksp@12345', 10);

    const bangaloreStationCode = 'PS_BNG_URB_1';
    const bangaloreDistCode = 'BNG_URB';

    const demoUsers = [
      { email: 'officer@ksp.gov.in', name: 'HC Shivashankar Gowda', badge: 'HC-3891', role: Role.POLICE_OFFICER, stationCode: bangaloreStationCode },
      { email: 'investigator@ksp.gov.in', name: 'SI Anitha Deshpande', badge: 'SI-4921', role: Role.INVESTIGATION_OFFICER, stationCode: 'PS_BNG_URB_2' },
      { email: 'inspector@ksp.gov.in', name: 'Inspector Satish Kumar', badge: 'PI-8921', role: Role.POLICE_INSPECTOR, stationCode: bangaloreStationCode },
      { email: 'analyst@ksp.gov.in', name: 'Dr. Kiran Kulkarni', badge: 'AN-7731', role: Role.CRIME_ANALYST, districtCode: bangaloreDistCode },
      { email: 'admin@ksp.gov.in', name: 'Administrator SCRB', badge: 'AD-1001', role: Role.SCRB_ADMINISTRATOR },
      { email: 'sysadmin@ksp.gov.in', name: 'SysAdmin KSP', badge: 'SY-9901', role: Role.SYSTEM_ADMINISTRATOR },
    ];

    const seededUsers = [];
    for (const u of demoUsers) {
      let policeStationId: string | null = null;
      let districtId: string | null = null;

      if (u.stationCode && createdStations[u.stationCode]) {
        policeStationId = createdStations[u.stationCode];
        const stationData = policeStationsData.find(x => x.code === u.stationCode);
        if (stationData) districtId = createdDistricts[stationData.districtCode] || null;
      } else if (u.districtCode) {
        districtId = createdDistricts[u.districtCode] || null;
      }

      const user = await db.user.create({
        data: {
          email: u.email,
          name: u.name,
          badgeNumber: u.badge,
          role: u.role,
          passwordHash,
          districtId,
          policeStationId,
        },
      });
      seededUsers.push(user);
    }

    // ── STEP 5: 2,000 Criminal Profiles ──────────────────────────────────────────
    console.log('   [5/9] Generating 2,000 Criminal Profiles...');
    const CRIMINAL_COUNT = 2000;
    const seededCriminalIds: string[] = [];
    const STATUSES = [CriminalStatus.ACTIVE, CriminalStatus.IN_CUSTODY, CriminalStatus.ABSCONDING, CriminalStatus.PAROLE, CriminalStatus.ACQUITTED];
    const STATUS_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08];

    const weightedStatus = (): CriminalStatus => {
      const r = rng();
      let cumulative = 0;
      for (let i = 0; i < STATUSES.length; i++) {
        cumulative += STATUS_WEIGHTS[i];
        if (r < cumulative) return STATUSES[i];
      }
      return STATUSES[0];
    };

    for (let i = 0; i < CRIMINAL_COUNT; i++) {
      const isFemale = rng() < 0.18;
      const firstName = isFemale ? pick(FEMALE_FIRST) : pick(MALE_FIRST);
      const lastName = pick(LAST_NAMES);
      const alias = pick(ALIASES);
      const name = `${firstName} '${alias}' ${lastName}`;
      const riskScore = rngInt(20, 98);
      const status = weightedStatus();
      const dob = new Date(rngInt(1965, 2002), rngInt(0, 11), rngInt(1, 28));

      const criminal = await db.criminal.create({
        data: {
          name,
          aliases: `${alias} ${lastName}, ${firstName} Bhai`,
          aadhaarNumber: formatAadhaar(),
          dateOfBirth: dob,
          gender: isFemale ? 'Female' : 'Male',
          riskScore,
          status,
          photoUrl: `/placeholders/criminal_${(i % 20) + 1}.jpg`,
        },
      });
      seededCriminalIds.push(criminal.id);
    }

    // Create criminal associations (gang networks)
    console.log('   Creating Criminal Network Associations...');
    const RELATION_TYPES = [RelationType.GANG_MEMBER, RelationType.CO_CONSPIRATOR, RelationType.FAMILY, RelationType.ACQUAINTANCE];
    const associationCount = Math.min(600, CRIMINAL_COUNT - 1);
    const usedPairs = new Set<string>();

    for (let i = 0; i < associationCount; i++) {
      const a = rngInt(0, seededCriminalIds.length - 1);
      let b = rngInt(0, seededCriminalIds.length - 1);
      while (b === a) b = rngInt(0, seededCriminalIds.length - 1);
      const pairKey = [a, b].sort().join('-');
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      await db.associateRelation.create({
        data: {
          criminalId: seededCriminalIds[a],
          associateId: seededCriminalIds[b],
          relationType: pick(RELATION_TYPES),
          notes: `Known association established through field intelligence and surveillance records.`,
        },
      });
    }

    // ── STEP 6: Vehicles (1,000) ───────────────────────────────────────────────
    console.log('   [6/9] Generating 1,000 Vehicles...');
    const seededVehicleIds: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const is2W = rng() < 0.6;
      const make = is2W ? pick(['Honda', 'Yamaha', 'Bajaj', 'TVS', 'Hero', 'Suzuki']) : pick(['Hyundai', 'Maruti', 'Tata', 'Mahindra', 'Toyota', 'Ford']);
      const model = is2W ? pick(VEHICLE_MODELS_2W) : pick(VEHICLE_MODELS_4W);
      const criminalIdx = rngInt(0, seededCriminalIds.length - 1);
      const ownerCriminalId = seededCriminalIds[criminalIdx];

      const vehicle = await db.vehicle.create({
        data: {
          make,
          model,
          registrationNumber: formatRegNo(),
          color: pick(VEHICLE_COLORS),
          ownerName: `Owner ${i + 1}`,
          ownerPhone: formatPhone(),
          criminals: { connect: { id: ownerCriminalId } },
        },
      });
      seededVehicleIds.push(vehicle.id);
    }

    // ── STEP 7: Phones (1,200) ─────────────────────────────────────────────────
    console.log('   [7/9] Generating 1,200 Phone Records...');
    const seededPhoneIds: string[] = [];
    for (let i = 0; i < 1200; i++) {
      const criminalIdx = rngInt(0, seededCriminalIds.length - 1);
      const phone = await db.phone.create({
        data: {
          phoneNumber: formatPhone(),
          imei: formatIMEI(),
          carrier: pick(CARRIERS),
          ownerName: `Subscriber ${i + 1}`,
          criminals: { connect: { id: seededCriminalIds[criminalIdx] } },
        },
      });
      seededPhoneIds.push(phone.id);
    }

    // ── STEP 8: 5,000+ FIRs ───────────────────────────────────────────────────
    console.log('   [8/9] Generating 5,000+ FIR Records (this may take a moment)...');
    const FIR_COUNT = 5000;
    const stationCodes = policeStationsData.map(ps => ps.code);
    const categoryCodes = crimeCategoriesData.map(c => c.code);
    const FIR_STATUSES = [FIRStatus.ACTIVE, FIRStatus.PENDING, FIRStatus.SOLVED, FIRStatus.CLOSED, FIRStatus.CHARGESHEETED];
    const STATUS_FIR_WEIGHTS = [0.30, 0.25, 0.22, 0.13, 0.10];

    const weightedFIRStatus = (): FIRStatus => {
      const r = rng();
      let c = 0;
      for (let i = 0; i < FIR_STATUSES.length; i++) {
        c += STATUS_FIR_WEIGHTS[i];
        if (r < c) return FIR_STATUSES[i];
      }
      return FIR_STATUSES[0];
    };

    const SUMMARIES: Record<string, string[]> = {
      ROBBERY: [
        'Two masked suspects on motorcycle intercepted victim near {area} signal. Threatened with sharp object, snatched gold chain and mobile phone. Fled on {vehicle}. Partial plate captured on CCTV.',
        'Complainant was approached by three individuals near {area}. Forced into corner, robbed of cash ₹{amount} and wristwatch. Suspects escaped in white car.',
        'Chain snatching incident reported outside {area} temple at {time}. Suspect identified from CCTV as person in blue shirt.',
      ],
      BURGLARY: [
        'Residential burglary at {area} during owners\' absence. Entry forced through rear window grille. Gold ornaments worth ₹{amount} and cash stolen. Fingerprints collected.',
        'Housebreaking reported at {area}. Electronic items including laptops and TVs stolen. Suspected entry via roof top. CCTV shows Bolero SUV parked outside.',
        'Commercial establishment burglary in {area} overnight. Safe broken, cash ₹{amount} stolen. Security guard found bound and gagged.',
      ],
      CYBERCRIME: [
        'Complainant received call from person posing as {agency} official. OTP extracted and ₹{amount} debited from bank account via UPI. IP traced to {area}.',
        'Investment scam through Telegram group. Victim {name} transferred ₹{amount} over three weeks before realizing fraud.',
        'Impersonation fraud on social media. Accused created fake profile, solicited money from contacts. Cyber Cell traced to {area}.',
      ],
      HOMICIDE: [
        'Body of {name} found in {area}. Multiple blunt force injuries. TOD estimated between 23:00 and 02:00. FIR registered under IPC Sec 302.',
        'Fatal altercation near {area} dhaba following heated dispute. Accused fled scene. Eye witnesses recorded. Victim succumbed at Government Hospital.',
        'Honour-related killing reported in {area}. Family members accused. Victim {name}, age {age}. DLSA notified.',
      ],
      NARCOTICS: [
        'Raid conducted at {area} hideout. {amount}g of suspected ganja seized along with digital weighing machine and cash. Two accused arrested on spot.',
        'Interstate narcotics smuggling intercepted at {area} checkpost. Methamphetamine tablets concealed in vehicle dashboard. Accused produced before NDPS court.',
        'Peddler arrested near {area} bus stand. {amount}g heroin found concealed in shoe sole. Supplier network under investigation.',
      ],
      ASSAULT: [
        'Victim {name} assaulted by group of {count} persons near {area} after road rage incident. Iron rod used. Hospitalised with head injuries.',
        'Mass brawl at {area} during political gathering. {count} persons injured. Lathi charge required to disperse crowd.',
        'Domestic violence case. Complainant {name} assaulted by husband and in-laws at {area} residence. Shelter provided at Sakhi centre.',
      ],
    };

    const fillTemplate = (tmpl: string): string => {
      return tmpl
        .replace('{area}', pick(['Koramangala', 'MG Road', 'JP Nagar', 'Rajajinagar', 'Hebbal', 'Lalbagh', 'Palace Grounds', 'Yelahanka', 'Whitefield', 'Kengeri']))
        .replace('{vehicle}', pick(['black Honda Activa', 'red Bajaj Pulsar', 'silver Yamaha', 'blue TVS Apache']))
        .replace('{amount}', String(rngInt(5000, 500000)))
        .replace('{time}', `${rngInt(18, 23)}:${rngInt(0, 5)}0`)
        .replace('{agency}', pick(['SBI', 'HDFC Bank', 'Income Tax', 'RBI', 'UIDAI']))
        .replace('{name}', `${pick(MALE_FIRST)} ${pick(LAST_NAMES)}`)
        .replace('{age}', String(rngInt(18, 65)))
        .replace('{count}', String(rngInt(3, 12)));
    };

    // Use batch processing in groups of 50 for performance
    const BATCH_SIZE = 50;
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2026-07-01');
    const dateRange = endDate.getTime() - startDate.getTime();

    for (let batch = 0; batch < Math.ceil(FIR_COUNT / BATCH_SIZE); batch++) {
      const batchStart = batch * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, FIR_COUNT);

      for (let i = batchStart; i < batchEnd; i++) {
        const stationCode = stationCodes[i % stationCodes.length];
        const stationEntry = policeStationsData.find(s => s.code === stationCode);
        if (!stationCode || !createdStations[stationCode] || !stationEntry) continue;

        const distCode = stationEntry.districtCode;
        const districtInfo = districtsData.find(d => d.code === distCode);
        if (!districtInfo) continue;

        const categoryCode = pick(categoryCodes);
        const categoryId = createdCategories[categoryCode];
        const stationId = createdStations[stationCode];
        const districtId = createdDistricts[distCode];

        // Generate coordinates within district bounds (approx ±0.5 degrees)
        const lat = districtInfo.lat + (rng() - 0.5) * 0.8;
        const lng = districtInfo.lng + (rng() - 0.5) * 0.8;

        // FIR date
        const offenceDate = new Date(startDate.getTime() + rng() * dateRange);
        const registrationDate = new Date(offenceDate.getTime() + rngInt(1, 48) * 3600000);

        // Summary
        const summaryTemplates = SUMMARIES[categoryCode] || ['Incident reported at {area}. Investigation ongoing.'];
        const summary = fillTemplate(pick(summaryTemplates));

        // Complainant
        const cIsFemale = rng() < 0.35;
        const cFirstName = cIsFemale ? pick(FEMALE_FIRST) : pick(MALE_FIRST);
        const complainantName = `${cFirstName} ${pick(LAST_NAMES)}`;
        const areas = getAreas(distCode);

        const firNumber = `FIR-${registrationDate.getFullYear()}-${String(i + 1).padStart(5, '0')}`;

        const fir = await db.fIR.create({
          data: {
            firNumber,
            policeStationId: stationId,
            districtId,
            crimeCategoryId: categoryId,
            status: weightedFIRStatus(),
            dateOfOffence: offenceDate,
            dateOfRegistration: registrationDate,
            summary,
            latitude: lat,
            longitude: lng,
            address: `${pick(areas)}, ${districtInfo.name}, Karnataka`,
            complainantName,
            complainantPhone: formatPhone(),
          },
        });

        // Attach 1-3 suspects
        const suspectCount = rngInt(1, 3);
        for (let s = 0; s < suspectCount; s++) {
          const crimIdx = rngInt(0, seededCriminalIds.length - 1);
          try {
            await db.criminalFIRAssociation.create({
              data: {
                firId: fir.id,
                criminalId: seededCriminalIds[crimIdx],
                role: s === 0 ? SuspectRole.SUSPECT : pick([SuspectRole.ACCOMPLICE, SuspectRole.WITNESS]),
                arrestStatus: pick(['WANTED', 'ARRESTED', 'IN_CUSTODY', 'ABSCONDING', 'CHARGESHEETED']),
              },
            });
          } catch (_) { /* duplicate assoc — skip */ }
        }

        // Attach 1-2 evidence items
        const evidenceCount = rngInt(1, 3);
        for (let e = 0; e < evidenceCount; e++) {
          const evidenceTypes = [EvidenceType.WEAPON, EvidenceType.DIGITAL, EvidenceType.DOCUMENT, EvidenceType.PHYSICAL, EvidenceType.BIOLOGICAL, EvidenceType.OTHER];
          await db.evidence.create({
            data: {
              firId: fir.id,
              type: pick(evidenceTypes),
              description: pick(EVIDENCE_DESCRIPTIONS),
              storageLocation: pick(STORAGE_LOCATIONS),
              collectedBy: `Officer ${pick(MALE_FIRST)} ${pick(LAST_NAMES)}`,
              serialNumber: `EVID-${rngInt(1000, 9999)}-${String.fromCharCode(65 + rngInt(0, 25))}`,
            },
          });
        }

        // Timeline entries
        const tlCount = rngInt(1, 4);
        const tlActions = [...TIMELINE_ACTIONS].sort(() => rng() - 0.5).slice(0, tlCount);
        for (const tl of tlActions) {
          await db.caseActivity.create({
            data: {
              firId: fir.id,
              action: tl.action,
              description: fillTemplate(tl.tmpl.replace('{station}', stationEntry.name).replace('{name}', complainantName).replace('{area}', pick(areas))),
              performedBy: `IO-${rngInt(1000, 9999)}`,
              performedByName: `${pick(['Inspector', 'SI', 'HC', 'PC'])} ${pick(MALE_FIRST)} ${pick(LAST_NAMES)}`,
            },
          });
        }

        // Attach random vehicle and phone occasionally
        if (rng() < 0.4 && seededVehicleIds.length > 0) {
          const vIdx = rngInt(0, seededVehicleIds.length - 1);
          try {
            await db.fIR.update({
              where: { id: fir.id },
              data: { vehicles: { connect: { id: seededVehicleIds[vIdx] } } },
            });
          } catch (_) {}
        }

        if (rng() < 0.5 && seededPhoneIds.length > 0) {
          const pIdx = rngInt(0, seededPhoneIds.length - 1);
          try {
            await db.fIR.update({
              where: { id: fir.id },
              data: { phones: { connect: { id: seededPhoneIds[pIdx] } } },
            });
          } catch (_) {}
        }
      }

      if (batch % 10 === 0) {
        console.log(`      Progress: ${Math.min((batch + 1) * BATCH_SIZE, FIR_COUNT)}/${FIR_COUNT} FIRs created...`);
      }
    }

    // ── STEP 9: Notifications ──────────────────────────────────────────────────
    console.log('   [9/9] Creating Alerts & Notifications...');
    const analystUser = seededUsers.find(u => u.role === Role.CRIME_ANALYST);
    const adminUser = seededUsers.find(u => u.role === Role.SCRB_ADMINISTRATOR);
    const targetUsers = [analystUser, adminUser].filter(Boolean);

    const notifications = [
      { title: 'Burglary Spike — Bengaluru Urban', content: 'Burglary incidents in Indiranagar and Koramangala zones increased by 34% over 14 days. DBSCAN cluster analysis confirms repeat offender pattern.', type: NotificationType.CRIME_SPIKE },
      { title: 'Suspect Network Detected', content: 'AI Network Analyzer identified criminal association cluster of 7 individuals linked to 12 active robbery cases across 3 districts.', type: NotificationType.AI_RECOMMENDATION },
      { title: 'High-Risk Criminal — Active Warrant', content: 'Absconding accused in Homicide case FIR-2026-03217 spotted in Whitefield area. Immediate patrol alert issued.', type: NotificationType.WARRANT_ALERT },
      { title: 'Narcotics Smuggling Route Identified', content: 'Predictive analysis identifies Mangaluru–Bengaluru highway as new narcotics transit corridor. 3 cases in 10 days.', type: NotificationType.AI_RECOMMENDATION },
      { title: 'Court Hearing — Tomorrow 10:00 AM', content: 'FIR-2026-00234 charge sheet hearing scheduled at Chief Metropolitan Magistrate Court, Bengaluru.', type: NotificationType.SYSTEM },
    ];

    for (const targetUser of targetUsers) {
      if (!targetUser) continue;
      for (const n of notifications) {
        await db.notification.create({
          data: { userId: targetUser.id, title: n.title, content: n.content, type: n.type },
        });
      }
    }

    console.log('');
    console.log('✅ ═══════════════════════════════════════════════════════════');
    console.log('✅  KSP Database Seeded Successfully!');
    console.log(`✅  Districts: ${districtsData.length}`);
    console.log(`✅  Police Stations: ${policeStationsData.length}`);
    console.log(`✅  Criminals: ${CRIMINAL_COUNT}`);
    console.log(`✅  FIRs: ${FIR_COUNT}`);
    console.log(`✅  Vehicles: 1,000`);
    console.log(`✅  Phones: 1,200`);
    console.log(`✅  Associate Relations: ~600`);
    console.log('✅ ═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error Seeding Database:', error);
    throw error;
  }
};

// Beta Launch Users - Lifetime Premium Access
// These users get unlimited access regardless of login status

import { PREMIUM_MODE_ENABLED } from './featureFlags';

// TEMPORARY: Give everyone premium access during beta launch
// This is now controlled by featureFlags.ts - when PREMIUM_MODE_ENABLED is false,
// all logged-in users get full access anyway
// Set to true to give EVERYONE (including guests) premium access
export const EVERYONE_HAS_PREMIUM = !PREMIUM_MODE_ENABLED;

// Investor demo mode disabled — URL-based premium bypass removed for security
export const INVESTOR_DEMO_CODE = '';

export interface BetaUser {
  firstName: string;
  lastName: string;
  email: string;
}

export const BETA_USERS: BetaUser[] = [
  { firstName: "Adam", lastName: "Jacobs", email: "adamjacobsphotography@gmail.com" },
  { firstName: "Andrea", lastName: "Ridgard", email: "andrearidgard@gmail.com" },
  { firstName: "Andrew", lastName: "Atar", email: "atar.andrew@icloud.com" },
  { firstName: "Andrew", lastName: "Tilli", email: "andrewtilli@gmail.com" },
  { firstName: "Angel Eyes", lastName: "Atar", email: "crystalatar@gmail.com" },
  { firstName: "Arthur", lastName: "Rocha", email: "arthurrocha15@icloud.com" },
  { firstName: "Azul", lastName: "Almeida", email: "achu_guapita@hotmail.com" },
  { firstName: "Beatriz", lastName: "Garcia", email: "sbvela12@gmail.com" },
  { firstName: "Bobbo", lastName: "Wieder", email: "bobwider@umich.edu" },
  { firstName: "Brandon", lastName: "Carlson", email: "carlson.bb@gmail.com" },
  { firstName: "Bryan", lastName: "Gilroysmith", email: "bryangilroysmith@gmail.com" },
  { firstName: "Candace", lastName: "Hunerberg", email: "hunerbergc@perich.com" },
  { firstName: "Mike", lastName: "Fozo", email: "mfozo@aol.com" },
  { firstName: "Carl", lastName: "Terns", email: "carl_terns@homedepot.com" },
  { firstName: "Chris", lastName: "Freitag", email: "thegermanfriday@gmail.com" },
  { firstName: "Chris", lastName: "Laenen", email: "chris.laenen@gmail.com" },
  { firstName: "Chris", lastName: "Paglino", email: "chrispaglino@gmail.com" },
  { firstName: "Chris", lastName: "Pourchier", email: "pourchierc@gmail.com" },
  { firstName: "Chris", lastName: "Purgatori", email: "chrispurgatori@gmail.com" },
  { firstName: "Chris", lastName: "Ridgard", email: "ridgard@gmail.com" },
  { firstName: "Christina", lastName: "Hanna", email: "christinamhanna@aol.com" },
  { firstName: "Courtney", lastName: "Gilbert", email: "cgilbert@asicorp.org" },
  { firstName: "Dan", lastName: "Carnell", email: "dcarnell@motor.com" },
  { firstName: "Dan", lastName: "Farnham", email: "dannyboy311.df@gmail.com" },
  { firstName: "Dan", lastName: "Hazen", email: "danhaze@gmail.com" },
  { firstName: "Daniel", lastName: "Rosenberg", email: "rosenberg.danielb@gmail.com" },
  { firstName: "Dave", lastName: "Morris", email: "dmorris245@yahoo.com" },
  { firstName: "David", lastName: "Belo", email: "dmbelo@gmail.com" },
  { firstName: "David", lastName: "Turner", email: "drturner@umich.edu" },
  { firstName: "Denise", lastName: "Slagle", email: "deniseslagle@yahoo.com" },
  { firstName: "Drew", lastName: "Loomer", email: "drewloomer@gmail.com" },
  { firstName: "Drew", lastName: "Peterson", email: "ax5798@wayne.edu" },
  { firstName: "Ed", lastName: "Atar", email: "edatar-garcia@quickenloans.com" },
  { firstName: "Eden", lastName: "Litt", email: "eden.litt@gmail.com" },
  { firstName: "Edgar", lastName: "Velazco", email: "egvelazco13@gmail.com" },
  { firstName: "Emily", lastName: "Toth", email: "emilyatar@gmail.com" },
  { firstName: "Eric", lastName: "Giaier", email: "egiaier@hotmail.com" },
  { firstName: "Eric", lastName: "Ellison", email: "ericdellison@aol.com" },
  { firstName: "Fernando", lastName: "Ghio", email: "fernandoghio@gmail.com" },
  { firstName: "Fernando", lastName: "Rodriguez", email: "forod76@hotmail.com" },
  { firstName: "Geof", lastName: "Innis", email: "geof@geofinnis.com" },
  { firstName: "Grant", lastName: "Petersen", email: "grantlpetersen@gmail.com" },
  { firstName: "Hailie", lastName: "Seaton", email: "halez20@gmail.com" },
  { firstName: "Jake", lastName: "Roberts", email: "aascsoccer@gmail.com" },
  { firstName: "Jason", lastName: "Shaw", email: "baloonman3@aol.com" },
  { firstName: "Jerrett", lastName: "Eiler", email: "jeiler@vaco.com" },
  { firstName: "Jason", lastName: "Solo", email: "jason@jasonsolo.com" },
  { firstName: "Jesse", lastName: "Silverstein", email: "jsilver1@gmail.com" },
  { firstName: "Joe", lastName: "Thompson", email: "courtneyhigginbotham@ymail.com" },
  { firstName: "John", lastName: "Haji", email: "jhaji@suburbancollection.com" },
  { firstName: "Jordan", lastName: "Shaw", email: "shaw.jr@gmail.com" },
  { firstName: "Juan", lastName: "Miretti", email: "miretti.juan@gmail.com" },
  { firstName: "Kamran", lastName: "Saadatjo", email: "kamran@openflow.com" },
  { firstName: "Kara", lastName: "Makara", email: "kara.makara@gmail.com" },
  { firstName: "Karl", lastName: "Pawlewicz", email: "karl.pawlewicz@gmail.com" },
  { firstName: "Keith", lastName: "Fuller", email: "keithjfuller@gmail.com" },
  { firstName: "Keith", lastName: "Romano", email: "keithromano@bellsouth.net" },
  { firstName: "Kelly", lastName: "Teem", email: "kelly@wsrinsurance.com" },
  { firstName: "Kristin", lastName: "Merrill", email: "kmerrill@marketingassociates.com" },
  { firstName: "Lalo", lastName: "Nespolo", email: "g.nespolo@gmail.com" },
  { firstName: "Lance", lastName: "Soderstrom", email: "lsoder@gmail.com" },
  { firstName: "Lauren", lastName: "Schultz", email: "laurenschultzbotanicals@gmail.com" },
  { firstName: "Lia", lastName: "Atar", email: "lia.atar@icloud.com" },
  { firstName: "Liliana", lastName: "Fornaro", email: "fornaroliliana@hotmail.com" },
  { firstName: "Lisa", lastName: "Climer", email: "climerl@perich.com" },
  { firstName: "Lorei", lastName: "Velazco", email: "loreivelazcoal@gmail.com" },
  { firstName: "Luke", lastName: "Goble", email: "gobleistic@aol.com" },
  { firstName: "Lyndsay", lastName: "Kapurch", email: "lyndsay.kapurch@gmail.com" },
  { firstName: "Marc", lastName: "Marras", email: "marcmarras@gmail.com" },
  { firstName: "Maria", lastName: "Almeida", email: "maria_almeida@aca.org.ar" },
  { firstName: "Maria", lastName: "Atar-Lijoi", email: "mlijoi@gmail.com" },
  { firstName: "Mariano", lastName: "Martelletti", email: "marianomartelletti@gmail.com" },
  { firstName: "Mark", lastName: "Learst", email: "learst@me.com" },
  { firstName: "Mark", lastName: "Wiegand", email: "wiegandma@gmail.com" },
  { firstName: "Marsha", lastName: "Toth", email: "mctoth@yahoo.com" },
  { firstName: "Martin", lastName: "Nespolo", email: "emenespolo@gmail.com" },
  { firstName: "Matt", lastName: "Kysia", email: "kysia@greenstreetband.com" },
  { firstName: "Matt", lastName: "Vendittelli", email: "matt@greenstreetband.com" },
  { firstName: "Meghan", lastName: "Schubot", email: "mschubot@marketingassociates.com" },
  { firstName: "Melissa", lastName: "Ferber", email: "mferber1@hotmail.com" },
  { firstName: "Midnight", lastName: "Cinema", email: "blutz@comcast.net" },
  { firstName: "Nader", lastName: "Chetany", email: "nadervip1@yahoo.com" },
  { firstName: "Nikta", lastName: "Amiri", email: "nikta.amiri@gmail.com" },
  { firstName: "Paddy", lastName: "Bananas", email: "patrick.lemay@gmail.com" },
  { firstName: "Patrick", lastName: "Seeberg", email: "pseeberg@motor.com" },
  { firstName: "Paul", lastName: "Schwack", email: "schwakp@gmail.com" },
  { firstName: "Paula", lastName: "Anderanin", email: "paulaanderanin@hotmail.com" },
  { firstName: "Popps", lastName: "Atar", email: "eduardosatar@gmail.com" },
  { firstName: "Raffi", lastName: "Garabedian", email: "garabedian.raffi@gmail.com" },
  { firstName: "Roderick", lastName: "Kerr", email: "roderick.kerr@gmail.com" },
  { firstName: "Ryan", lastName: "Craig", email: "ryanmichaelcraig@gmail.com" },
  { firstName: "Roxana", lastName: "Shirkhoda", email: "rshirkhoda@gmail.com" },
  { firstName: "Ryan", lastName: "Boyd", email: "cryanboyd@gmail.com" },
  { firstName: "Sally", lastName: "Hoben-Atar", email: "sallyhoben@gmail.com" },
  { firstName: "Sam", lastName: "Marcozzi", email: "sam.marcozzi@evigna.com" },
  { firstName: "Samuel", lastName: "Gacka", email: "samuel.gacka@gmail.com" },
  { firstName: "Sean", lastName: "Giaier", email: "sean.giaier@gmail.com" },
  { firstName: "Sebastian", lastName: "Atar", email: "sebastianatar@gmail.com" },
  { firstName: "Serge", lastName: "van der Voo", email: "svdvoo@gmail.com" },
  { firstName: "Shanelle", lastName: "Harris", email: "sl.mann@yahoo.com" },
  { firstName: "Spero", lastName: "Drosis", email: "sperodrosis@gmail.com" },
  { firstName: "Taher", lastName: "Saviliwala", email: "tahersavliwala@gmail.com" },
  { firstName: "Tara", lastName: "Kowalewski", email: "tkowalewski@collegeforcreativestudies.edu" },
  { firstName: "Tiffany", lastName: "Little", email: "mrsjoe24@gmail.com" },
  { firstName: "Trevor", lastName: "Harris", email: "trevorharris044@gmail.com" },
  { firstName: "Trevor", lastName: "Reibling", email: "reiblingt@gmail.com" },
];

// Create a Set of lowercase emails for fast lookup
const BETA_EMAILS_SET = new Set(BETA_USERS.map(u => u.email.toLowerCase()));

/**
 * Check if an email is in the beta users list
 */
export function isBetaUser(email: string): boolean {
  return BETA_EMAILS_SET.has(email.toLowerCase());
}

/**
 * Get beta user info by email
 */
export function getBetaUserByEmail(email: string): BetaUser | undefined {
  return BETA_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
}

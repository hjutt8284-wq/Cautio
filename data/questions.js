// Cybersecurity Questions Database — 45 Runner + 35 Quiz
const runnerQuestions = [
    {
        id: 1,
        question: "You receive an email from your 'bank' asking you to click a link to verify your account details. What should you do?",
        correct: "Delete the email and contact your bank directly using official contact information",
        incorrect: "Click the link immediately to secure your account",
        explanation: "Phishing emails often impersonate banks. Always verify requests through official channels, not email links."
    },
    {
        id: 2,
        question: "Your friend sends you a USB drive with 'vacation photos'. What's the safest approach?",
        correct: "Scan it with antivirus software before opening any files",
        incorrect: "Plug it in immediately - it's from a trusted friend",
        explanation: "USB drives can contain malware, even from trusted sources. Always scan unknown media first."
    },
    {
        id: 3,
        question: "You're creating a new password for your work account. Which is more secure?",
        correct: "MyDog$Love2024Run! (longer with symbols and numbers)",
        incorrect: "Password123 (simple and easy to remember)",
        explanation: "Strong passwords should be long, include various character types, and avoid common patterns."
    },
    {
        id: 4,
        question: "You're at a coffee shop and see a free WiFi network called 'Free_Coffee_WiFi'. Should you connect?",
        correct: "Use your mobile hotspot instead - public WiFi can be unsafe",
        incorrect: "Connect immediately - free internet is always good",
        explanation: "Public WiFi networks can be fake or unsecured, allowing attackers to intercept your data."
    },
    {
        id: 5,
        question: "Your computer shows a popup saying 'Your computer is infected! Call this number immediately!' What should you do?",
        correct: "Close the popup - it's likely a scam trying to steal your money",
        incorrect: "Call the number - they're trying to help you",
        explanation: "Tech support scams use fake alerts to trick people into paying for unnecessary services."
    },
    {
        id: 6,
        question: "You receive a text message with a verification code you didn't request. What should you do?",
        correct: "Don't share it with anyone - someone may be trying to hack your account",
        incorrect: "Reply with the code to be helpful",
        explanation: "Unexpected verification codes indicate someone may be attempting to access your accounts."
    },
    {
        id: 7,
        question: "Your company asks you to enable two-factor authentication (2FA). How do you feel about this?",
        correct: "Great! 2FA adds an important security layer to protect accounts",
        incorrect: "Annoying - passwords should be enough security",
        explanation: "2FA significantly improves security by requiring a second form of verification beyond passwords."
    },
    {
        id: 8,
        question: "You get a notification that your software has an available security update. What should you do?",
        correct: "Install it promptly - security updates fix important vulnerabilities",
        incorrect: "Ignore it - updates often cause problems",
        explanation: "Security updates patch vulnerabilities that hackers could exploit. Install them promptly."
    },
    {
        id: 9,
        question: "A stranger on social media offers you a job that seems too good to be true. What should you do?",
        correct: "Research the company independently - it might be a scam",
        incorrect: "Accept immediately - it's a great opportunity",
        explanation: "Job scams often target people through social media with unrealistic offers."
    },
    {
        id: 10,
        question: "You're working from home and your family wants to use your work laptop. What should you do?",
        correct: "Use a separate device - work data should stay secure",
        incorrect: "Share it - family members are trustworthy",
        explanation: "Work devices should only be used for work to maintain security and compliance."
    },
    {
        id: 11,
        question: "You notice unfamiliar login activity on your email account. What's your first step?",
        correct: "Change your password immediately and enable 2FA",
        incorrect: "Ignore it - probably just a glitch",
        explanation: "Suspicious login activity indicates a potential security breach requiring immediate action."
    },
    {
        id: 12,
        question: "A website asks you to disable your ad blocker to view content. Should you do it?",
        correct: "Be cautious - some ads can contain malware",
        incorrect: "Always comply - websites need ad revenue",
        explanation: "Malicious ads (malvertising) can infect your computer. Consider the website's trustworthiness first."
    },
    {
        id: 13,
        question: "You're downloading software from the internet. What's the safest approach?",
        correct: "Download only from official websites and check reviews",
        incorrect: "Use any site that has the software - they're all the same",
        explanation: "Third-party download sites often bundle malware with legitimate software."
    },
    {
        id: 14,
        question: "Your antivirus software expires. What should you do?",
        correct: "Renew it immediately - antivirus protection is essential",
        incorrect: "Don't worry - modern computers don't need antivirus",
        explanation: "Antivirus software provides crucial protection against malware and should be kept current."
    },
    {
        id: 15,
        question: "You receive a call claiming to be from tech support saying your computer is compromised. What do you do?",
        correct: "Hang up - legitimate companies don't make unsolicited calls",
        incorrect: "Give them remote access to fix the problem",
        explanation: "Tech support scammers call randomly claiming computer problems to gain access or steal money."
    },
    {
        id: 16,
        question: "You're creating a backup of important files. Where's the safest place to store it?",
        correct: "Multiple locations including offline storage",
        incorrect: "Just on your computer's hard drive",
        explanation: "The 3-2-1 backup rule: 3 copies, 2 different media types, 1 offsite location."
    },
    {
        id: 17,
        question: "A colleague asks for your login credentials to check something quickly. What should you do?",
        correct: "Never share credentials - offer to do the task yourself",
        incorrect: "Share them - they're a trusted colleague",
        explanation: "Login credentials should never be shared, even with trusted colleagues. Use proper access controls instead."
    },
    {
        id: 18,
        question: "You find a USB drive in the parking lot. What should you do?",
        correct: "Turn it in to security - don't plug it into any computer",
        incorrect: "Plug it in to see what's on it and find the owner",
        explanation: "Found USB drives are often used in social engineering attacks and may contain malware."
    },
    {
        id: 19,
        question: "Your smartphone asks if you want to automatically join available WiFi networks. What should you choose?",
        correct: "Disable auto-join - manually select trusted networks only",
        incorrect: "Enable it for convenience - it saves time",
        explanation: "Auto-joining WiFi networks can connect you to malicious hotspots without your knowledge."
    },
    {
        id: 20,
        question: "You receive an urgent email from your CEO asking you to buy gift cards for a client. What should you do?",
        correct: "Verify the request through another communication method first",
        incorrect: "Buy the gift cards immediately - the CEO is waiting",
        explanation: "CEO fraud is a common scam where criminals impersonate executives to trick employees."
    },
    {
        id: 21,
        question: "Your web browser warns that a website's security certificate is invalid. What should you do?",
        correct: "Don't proceed - the connection might not be secure",
        incorrect: "Click 'proceed anyway' - certificates often have issues",
        explanation: "Invalid certificates can indicate a compromised or fake website. Trust browser security warnings."
    },
    {
        id: 22,
        question: "You want to check your bank balance while on public WiFi. What's the safest approach?",
        correct: "Use your mobile data instead of public WiFi",
        incorrect: "Use the public WiFi - banks have secure websites",
        explanation: "Public WiFi can be monitored by attackers. Use mobile data for sensitive activities."
    },
    {
        id: 23,
        question: "A pop-up advertisement claims you've won a prize and asks for personal information. What should you do?",
        correct: "Close it immediately - it's likely a scam",
        incorrect: "Provide the information - you might have actually won",
        explanation: "Unexpected prize notifications are typically scams designed to collect personal information."
    },
    {
        id: 24,
        question: "You're setting up a new online account. The password field shows your password in plain text. Is this concerning?",
        correct: "Yes - passwords should be hidden with asterisks or dots",
        incorrect: "No - it's helpful to see what you're typing",
        explanation: "Websites that don't hide passwords properly may not follow other security best practices."
    },
    {
        id: 25,
        question: "Your computer starts running very slowly and you notice unknown programs running. What should you do?",
        correct: "Run a full antivirus scan - your computer might be infected",
        incorrect: "Restart the computer - that usually fixes performance issues",
        explanation: "Sudden performance issues and unknown programs can indicate malware infection requiring immediate attention."
    },
    // --- 20 HARDER QUESTIONS ---
    {
        id: 26,
        question: "An attacker has already obtained your password. What single extra control would stop them logging in?",
        correct: "Multi-factor authentication (MFA) requiring a second verification step",
        incorrect: "Using a longer password next time",
        explanation: "MFA blocks an attacker even if they know your password, because they still need the second factor you physically possess."
    },
    {
        id: 27,
        question: "You receive an email that perfectly mimics your company's IT department asking for urgent VPN credentials. What attack is this?",
        correct: "Spear phishing — a targeted attack using personal context to appear legitimate",
        incorrect: "A routine IT security audit — you should comply",
        explanation: "Spear phishing is personalised phishing. IT departments never ask for credentials via email. Always verify out-of-band."
    },
    {
        id: 28,
        question: "You open a PDF from an unknown sender. Seconds later, a command prompt flashes briefly. What happened?",
        correct: "The PDF likely exploited a vulnerability and ran malicious code — disconnect immediately",
        incorrect: "Adobe Acrobat ran a routine background update",
        explanation: "Malicious PDFs can exploit reader vulnerabilities to execute code. Seeing an unexpected command prompt is a major red flag."
    },
    {
        id: 29,
        question: "You discover your company's cloud storage bucket is publicly readable on the internet. What is the immediate risk?",
        correct: "Sensitive data exposure — anyone online can read those files",
        incorrect: "Performance degradation from too many readers",
        explanation: "Misconfigured public cloud storage has caused massive data breaches. Restrict access to authenticated users immediately."
    },
    {
        id: 30,
        question: "A vendor asks your company to whitelist their IP so they can access your internal API directly. What should you insist on?",
        correct: "Mutual TLS or API keys with strict rate-limiting and logging in addition to IP allowlisting",
        incorrect: "IP allowlisting alone is sufficient",
        explanation: "IP addresses can be spoofed or shared. Layer authentication and monitoring with network controls for defence-in-depth."
    },
    {
        id: 31,
        question: "You notice your password manager's master password was part of a recent data breach. What do you do first?",
        correct: "Change the master password immediately and rotate all stored credentials",
        incorrect: "Wait to see if any accounts show suspicious activity",
        explanation: "If your master password is compromised every stored credential is at risk. Act proactively before damage occurs."
    },
    {
        id: 32,
        question: "Ransomware encrypts your work files. You have yesterday's offline backup. What should you do?",
        correct: "Wipe and restore from the clean backup — do not pay the ransom",
        incorrect: "Pay the ransom to get decryption keys faster",
        explanation: "Paying ransoms funds criminals and does not guarantee file recovery. Clean offline backups are the correct defence."
    },
    {
        id: 33,
        question: "A developer commits AWS secret keys to a public GitHub repository by mistake. What is the FIRST action?",
        correct: "Immediately revoke and rotate the exposed keys — assume they are already compromised",
        incorrect: "Delete the commit from history and hope no one noticed",
        explanation: "Secrets exposed publicly are scraped by bots within seconds. Deleting the commit does not remove the exposure."
    },
    {
        id: 34,
        question: "During a penetration test, the tester finds a login form vulnerable to SQL injection. What must the developer do?",
        correct: "Use parameterised queries (prepared statements) and never concatenate user input into SQL",
        incorrect: "Add a CAPTCHA to the login page",
        explanation: "SQL injection is prevented by separating code from data using parameterised queries. CAPTCHAs do not address the underlying vulnerability."
    },
    {
        id: 35,
        question: "An attacker calls your IT helpdesk pretending to be a locked-out executive to reset a password. What attack is this?",
        correct: "Social engineering / vishing — impersonation over the phone to bypass security controls",
        incorrect: "Brute-force attack against the password reset portal",
        explanation: "Vishing exploits human trust. Helpdesks must verify identity through established out-of-band procedures before any account change."
    },
    {
        id: 36,
        question: "You are reviewing a web application and notice user-supplied data is reflected in the page without encoding. What vulnerability is this?",
        correct: "Cross-Site Scripting (XSS) — allowing attackers to inject malicious scripts",
        incorrect: "CSRF — cross-site request forgery",
        explanation: "XSS lets attackers run arbitrary JavaScript in victims' browsers. Output encoding prevents this; always sanitise and encode user data before rendering."
    },
    {
        id: 37,
        question: "Your organisation's SIEM alerts on 10,000 failed login attempts in 5 minutes from a single IP. What attack is most likely?",
        correct: "Credential stuffing or brute-force — automate blocking and alert the security team immediately",
        incorrect: "A misconfigured internal monitoring agent",
        explanation: "High-velocity login failures from one source indicate an automated attack. Rate-limiting, geo-blocking and account lockouts are the defences."
    },
    {
        id: 38,
        question: "An employee reports their browser is redirecting searches to an unfamiliar search engine. What is the likely cause?",
        correct: "Browser hijacker malware — isolate the device and run a full malware scan",
        incorrect: "A browser update changed the default search engine setting",
        explanation: "Browser hijackers modify settings to redirect traffic for ad revenue or to intercept sensitive searches. A compromised browser needs remediation."
    },
    {
        id: 39,
        question: "A Zero-Day vulnerability is publicly announced in software your company uses. You have no patch yet. What is the best interim action?",
        correct: "Apply vendor mitigations, increase monitoring, and restrict access to the vulnerable system until a patch is available",
        incorrect: "Wait for the official patch before taking any action",
        explanation: "Zero-days can be exploited immediately. Mitigating controls (WAF rules, network segmentation, enhanced logging) reduce risk while a patch is prepared."
    },
    {
        id: 40,
        question: "You receive an HTTPS link in a chat message. The padlock icon is green. Is the site definitely safe?",
        correct: "No — HTTPS only encrypts transit; the site itself could still be malicious or phishing",
        incorrect: "Yes — a padlock means the site is legitimate and secure",
        explanation: "Attackers routinely obtain valid TLS certificates for phishing domains. HTTPS means your connection is encrypted, not that the destination is trustworthy."
    },
    {
        id: 41,
        question: "Your app stores user session tokens in localStorage. Why is this a security risk?",
        correct: "Any JavaScript on the page (including XSS payloads) can read localStorage and steal session tokens",
        incorrect: "localStorage is encrypted by the browser and therefore safe",
        explanation: "localStorage is accessible to all scripts on the page. Prefer HttpOnly cookies for session tokens so JavaScript cannot access them."
    },
    {
        id: 42,
        question: "An attacker intercepts and replays an older valid API request to perform an unauthorised action. What control would have prevented this?",
        correct: "Request signing with a timestamp or nonce to ensure each request is unique and time-limited",
        incorrect: "Using HTTPS would have prevented the replay",
        explanation: "Replay attacks reuse captured legitimate requests. Nonces and short-lived timestamps invalidate replayed requests even if the payload was originally valid."
    },
    {
        id: 43,
        question: "Your company uses a third-party analytics library hosted on an external CDN. What supply-chain risk does this introduce?",
        correct: "If the CDN or library is compromised, malicious code runs in every user's browser",
        incorrect: "External CDNs are monitored by internet authorities and are always safe",
        explanation: "Supply-chain attacks (e.g. SolarWinds, Polyfill.io) insert malicious code into trusted third-party assets. Use Subresource Integrity (SRI) hashes to verify scripts."
    },
    {
        id: 44,
        question: "A server error page exposes a full stack trace including database connection strings. Why is this critical?",
        correct: "Attackers gain exact knowledge of your tech stack, file paths, and potentially credentials — hide all error details in production",
        incorrect: "Stack traces are only visible to authenticated users so it is low risk",
        explanation: "Information disclosure accelerates attacks. Production error pages should show only generic messages; log details server-side securely."
    },
    {
        id: 45,
        question: "You are asked to review a new feature that stores encrypted credit card numbers in the database. The team uses MD5 for encryption. What is wrong?",
        correct: "MD5 is a hash function, not encryption — it is also cryptographically broken and must never be used for sensitive data",
        incorrect: "MD5 is a strong algorithm and is fine for storing payment data",
        explanation: "MD5 is irreversible (a hash, not encryption) and is trivially broken. Payment data requires strong authenticated encryption (AES-256-GCM) and PCI-DSS compliance."
    }
];

const quizQuestions = [
    {
        id: 1,
        question: "What is phishing?",
        options: [
            "A method of fishing for compliments online",
            "A technique used by cybercriminals to steal sensitive information by pretending to be trustworthy",
            "A way to improve internet speed",
            "A programming language"
        ],
        correct: 1,
        explanation: "Phishing is a social engineering attack where criminals impersonate legitimate organizations to steal personal information like passwords, credit card details, or social security numbers."
    },
    {
        id: 2,
        question: "What makes a strong password?",
        options: [
            "Your birthday and name",
            "At least 12 characters with a mix of letters, numbers, and symbols",
            "A common word from the dictionary",
            "The same password for all accounts"
        ],
        correct: 1,
        explanation: "Strong passwords should be long (at least 12 characters), contain a mix of uppercase and lowercase letters, numbers, and special characters, and be unique for each account."
    },
    {
        id: 3,
        question: "What is two-factor authentication (2FA)?",
        options: [
            "A security method requiring two different authentication factors to verify identity",
            "Using two different browsers",
            "Having two passwords",
            "Logging in twice"
        ],
        correct: 0,
        explanation: "2FA adds an extra security layer by requiring something you know (password) and something you have (phone, token) or something you are (biometric) to access accounts."
    },
    {
        id: 4,
        question: "What should you do if you receive a suspicious email attachment?",
        options: [
            "Open it immediately to see what it contains",
            "Forward it to all your contacts",
            "Don't open it and verify the sender through another communication method",
            "Reply asking if it's safe"
        ],
        correct: 2,
        explanation: "Never open suspicious attachments. Verify with the sender through a separate communication method, and use antivirus software to scan any attachments before opening."
    },
    {
        id: 5,
        question: "What is ransomware?",
        options: [
            "A type of antivirus program",
            "A legitimate software licensing model",
            "A method to improve computer performance",
            "Software that encrypts your files and demands payment for decryption"
        ],
        correct: 3,
        explanation: "Ransomware is malicious software that encrypts a victim's files, making them inaccessible, and demands payment (usually in cryptocurrency) for the decryption key."
    },
    {
        id: 6,
        question: "Why are software updates important for security?",
        options: [
            "They make your computer run faster",
            "They add new features",
            "They fix security vulnerabilities that hackers could exploit",
            "They change the appearance of software"
        ],
        correct: 2,
        explanation: "Security updates patch vulnerabilities that cybercriminals could exploit to gain unauthorized access to your system or steal data. Install updates promptly."
    },
    {
        id: 7,
        question: "What is social engineering in cybersecurity?",
        options: [
            "Building social media networks",
            "Engineering software for social platforms",
            "A type of computer programming",
            "Psychological manipulation to trick people into revealing confidential information"
        ],
        correct: 3,
        explanation: "Social engineering exploits human psychology rather than technical vulnerabilities, tricking people into breaking security procedures and revealing confidential information."
    },
    {
        id: 8,
        question: "What should you do when using public WiFi?",
        options: [
            "Connect to any available network",
            "Avoid accessing sensitive information and use a VPN if possible",
            "Share the password with others",
            "Turn off all security settings for better connectivity"
        ],
        correct: 1,
        explanation: "Public WiFi networks are often unsecured and can be monitored by attackers. Avoid sensitive activities and use a VPN to encrypt your internet traffic."
    },
    {
        id: 9,
        question: "What is a VPN and why is it useful?",
        options: [
            "Very Private Network - it makes your computer faster",
            "Verified Personal Network - it verifies your identity",
            "Virtual Private Network - it creates a secure, encrypted connection over the internet",
            "Visual Programming Network - it helps with coding"
        ],
        correct: 2,
        explanation: "A VPN (Virtual Private Network) creates an encrypted tunnel between your device and a VPN server, protecting your internet traffic from interception and hiding your IP address."
    },
    {
        id: 10,
        question: "What is the principle of least privilege?",
        options: [
            "Giving users the maximum access possible",
            "Removing all user privileges",
            "Giving users only the minimum access necessary to perform their job functions",
            "Giving everyone the same level of access"
        ],
        correct: 2,
        explanation: "The principle of least privilege limits user access rights to only what is necessary for their legitimate purpose, reducing the potential damage from accidents or malicious activity."
    },
    {
        id: 11,
        question: "What should you do if you suspect your computer is infected with malware?",
        options: [
            "Continue using it normally",
            "Disconnect from the internet and run antivirus software",
            "Delete all your files",
            "Share your concerns on social media"
        ],
        correct: 1,
        explanation: "If you suspect malware infection, disconnect from the internet to prevent data theft, run a full antivirus scan, and consider seeking professional help if the problem persists."
    },
    {
        id: 12,
        question: "What is a firewall?",
        options: [
            "A wall made of fire",
            "A security system that monitors and controls incoming and outgoing network traffic",
            "A type of antivirus software",
            "A password manager"
        ],
        correct: 1,
        explanation: "A firewall is a security system that creates a barrier between trusted internal networks and untrusted external networks, filtering traffic based on predetermined security rules."
    },
    {
        id: 13,
        question: "Why should you be cautious about what you share on social media?",
        options: [
            "It's not important - share everything",
            "Personal information can be used by cybercriminals for identity theft or targeted attacks",
            "Social media companies don't allow sharing",
            "It slows down your internet connection"
        ],
        correct: 1,
        explanation: "Information shared on social media can be used by cybercriminals to craft convincing phishing attacks, steal your identity, or answer security questions for your accounts."
    },
    {
        id: 14,
        question: "What is the best way to handle suspicious phone calls claiming to be from tech support?",
        options: [
            "Give them remote access to your computer",
            "Provide your personal information to verify your identity",
            "Ask them to call back later",
            "Hang up and contact the company directly using official contact information"
        ],
        correct: 3,
        explanation: "Legitimate tech support companies don't make unsolicited calls. If you receive such calls, hang up and contact the company directly using official contact information if you have concerns."
    },
    {
        id: 15,
        question: "What is the purpose of backing up your data?",
        options: [
            "To protect against data loss from hardware failure, malware, or accidents",
            "To make your computer faster",
            "To increase storage space",
            "To share files with others"
        ],
        correct: 0,
        explanation: "Regular backups protect your important data from loss due to hardware failures, malware attacks, accidental deletion, or natural disasters. Follow the 3-2-1 backup rule for best protection."
    },
    {
        id: 16,
        question: "What does 'defence in depth' mean in cybersecurity?",
        options: [
            "Installing the most expensive firewall available",
            "Encrypting data only at rest",
            "Layering multiple independent security controls so that if one fails, others still protect the system",
            "Hiring a large security team"
        ],
        correct: 2,
        explanation: "Defence in depth applies multiple security layers (network, host, application, data) so a single breach does not give an attacker full access."
    },
    {
        id: 17,
        question: "What is a Man-in-the-Middle (MitM) attack?",
        options: [
            "An attack where two servers fight over the same IP address",
            "A denial-of-service attack that fills bandwidth",
            "Installing malware through a USB port",
            "An attack where the adversary secretly intercepts and possibly alters communications between two parties"
        ],
        correct: 3,
        explanation: "In MitM attacks, the adversary positions themselves between communicating parties to eavesdrop or modify data without either side knowing."
    },
    {
        id: 18,
        question: "Which hashing algorithm is considered cryptographically broken and should NOT be used for security?",
        options: [
            "MD5",
            "SHA-256",
            "bcrypt",
            "SHA-3"
        ],
        correct: 0,
        explanation: "MD5 produces collisions trivially and is completely broken for security purposes. Use SHA-256 or stronger, and bcrypt/Argon2 for passwords."
    },
    {
        id: 19,
        question: "What is a Zero-Day vulnerability?",
        options: [
            "A vulnerability that takes zero days to patch",
            "A bug introduced on the first day of software development",
            "A flaw that is unknown to the vendor and therefore has no patch available",
            "A vulnerability that only affects systems running zero-day-old software"
        ],
        correct: 2,
        explanation: "Zero-day vulnerabilities are unknown to the vendor, so no patch exists. Attackers exploit them before any fix can be deployed, making them especially dangerous."
    },
    {
        id: 20,
        question: "What is Cross-Site Scripting (XSS)?",
        options: [
            "Injecting malicious scripts into web pages viewed by other users",
            "An attack that crosses national internet borders",
            "A method of forging web requests from a user's browser",
            "Scanning multiple websites simultaneously"
        ],
        correct: 0,
        explanation: "XSS lets attackers inject client-side scripts into pages viewed by other users, enabling session hijacking, credential theft, and malware distribution."
    },
    {
        id: 21,
        question: "What does SQL injection allow an attacker to do?",
        options: [
            "Speed up slow database queries",
            "Change the colour scheme of a website",
            "Overflow a network buffer with traffic",
            "Manipulate or extract data from a database by inserting malicious SQL code into input fields"
        ],
        correct: 3,
        explanation: "SQL injection exploits poorly sanitised inputs to manipulate database queries, potentially allowing an attacker to read, modify, or delete all data."
    },
    {
        id: 22,
        question: "What is the primary purpose of a Security Operations Centre (SOC)?",
        options: [
            "Developing new software products",
            "Continuously monitoring and analysing an organisation's security posture to detect and respond to threats",
            "Managing employee payroll and HR data",
            "Conducting penetration testing once a year"
        ],
        correct: 1,
        explanation: "A SOC provides 24/7 monitoring of systems and networks, triage of security events, incident response, and threat intelligence analysis."
    },
    {
        id: 23,
        question: "What is credential stuffing?",
        options: [
            "Adding extra characters to make a password longer",
            "Storing credentials in an encrypted file",
            "Using large lists of breached username/password pairs to try logging into other services",
            "Stuffing physical credentials into a USB drive"
        ],
        correct: 2,
        explanation: "Credential stuffing exploits password reuse. Because many people reuse passwords across sites, leaked credentials from one breach work on other services."
    },
    {
        id: 24,
        question: "What does the term 'attack surface' mean?",
        options: [
            "The sum of all points where an attacker can attempt to enter or extract data from an environment",
            "The physical desk area used by hackers",
            "The total number of employees who can be phished",
            "The screen area covered by malware pop-ups"
        ],
        correct: 0,
        explanation: "Reducing attack surface — by disabling unnecessary services, closing unused ports, and limiting access — is a fundamental security hardening technique."
    },
    {
        id: 25,
        question: "Why is it dangerous to use the same password on multiple websites?",
        options: [
            "It's not dangerous — it's recommended for convenience",
            "Browsers cannot remember the same password twice",
            "It slows down the login process on each site",
            "If one site is breached, attackers can use those credentials to access all your other accounts"
        ],
        correct: 3,
        explanation: "Password reuse enables credential stuffing attacks. A breach at any one site immediately compromises all accounts sharing that password."
    },
    {
        id: 26,
        question: "What is a supply-chain attack?",
        options: [
            "Attacking a company's physical delivery trucks",
            "Intercepting goods ordered through an e-commerce website",
            "Overloading a payment processing system",
            "Compromising a trusted third-party software or hardware component to reach the ultimate target"
        ],
        correct: 3,
        explanation: "Supply-chain attacks (e.g. SolarWinds, XZ Utils) exploit trust in third-party vendors. Organisations must vet dependencies and monitor for unexpected changes."
    },
    {
        id: 27,
        question: "What is the key security advantage of using HTTPS over HTTP?",
        options: [
            "Pages load faster",
            "Websites rank higher in search results",
            "The connection between client and server is encrypted, preventing eavesdropping and tampering",
            "Servers use less electricity"
        ],
        correct: 2,
        explanation: "HTTPS uses TLS to encrypt data in transit, preventing MitM eavesdropping. It also authenticates the server, confirming you are talking to the intended site."
    },
    {
        id: 28,
        question: "What is a botnet?",
        options: [
            "A network of compromised computers controlled remotely by an attacker to perform malicious tasks",
            "A network of automated customer-service robots",
            "A set of security bots that defend a network",
            "A cluster of high-performance computing nodes"
        ],
        correct: 0,
        explanation: "Botnets are used for DDoS attacks, spam campaigns, credential stuffing, and cryptocurrency mining — all without the device owners' knowledge."
    },
    {
        id: 29,
        question: "What does 'encryption at rest' protect against?",
        options: [
            "Interception of data as it travels across a network",
            "Brute-force attacks against login portals",
            "Unauthorised access to data stored on disk if physical media is stolen or improperly decommissioned",
            "Denial-of-service attacks"
        ],
        correct: 2,
        explanation: "Encrypting stored data means that even if an attacker gains physical access to a hard drive or backup tape, they cannot read the data without the decryption key."
    },
    {
        id: 30,
        question: "An application logs user passwords in plaintext to a debug log file. Why is this a critical vulnerability?",
        options: [
            "Anyone with access to the log file can read users' passwords and compromise their accounts across all services",
            "It is not a vulnerability — logging aids debugging",
            "It wastes disk space",
            "It only affects users who have weak passwords"
        ],
        correct: 0,
        explanation: "Logging plaintext passwords is a severe breach of security hygiene. Log files are often widely accessible, stored insecurely, or forwarded to monitoring systems."
    },
    {
        id: 31,
        question: "What is the purpose of a Web Application Firewall (WAF)?",
        options: [
            "To physically fireproof a server room",
            "To speed up web page delivery via caching",
            "To encrypt data at rest inside a database",
            "To filter and monitor HTTP traffic, blocking common web attacks such as XSS and SQL injection"
        ],
        correct: 3,
        explanation: "A WAF sits in front of web applications and inspects HTTP requests, blocking known attack patterns. It is a key control but not a substitute for secure coding."
    },
    {
        id: 32,
        question: "What is the concept of 'Security by Obscurity' and why is it insufficient?",
        options: [
            "Hiding server locations on the dark web — it is highly effective",
            "Relying on keeping implementation details secret as the main security mechanism — it fails once the secret is discovered",
            "Encrypting all data with a custom algorithm — it is more secure than standard ones",
            "Limiting documentation so attackers cannot learn the system — it is a best practice"
        ],
        correct: 1,
        explanation: "Security by obscurity is not a reliable defence. Secrets leak, reverse engineering is possible, and systems must be secure even when their design is fully known."
    },
    {
        id: 33,
        question: "What best describes a Distributed Denial of Service (DDoS) attack?",
        options: [
            "Sending a single oversized packet to crash a server",
            "Using many compromised systems simultaneously to overwhelm a target with traffic, making it unavailable",
            "Logging into multiple accounts from different locations at the same time",
            "Distributing malware to multiple endpoints via email"
        ],
        correct: 1,
        explanation: "DDoS attacks use botnets to flood targets with traffic. Mitigations include rate-limiting, CDN scrubbing services, and upstream filtering."
    },
    {
        id: 34,
        question: "Why should session cookies be flagged as 'HttpOnly'?",
        options: [
            "It prevents JavaScript from accessing the cookie, reducing the risk of session theft via XSS",
            "It makes cookies load faster",
            "It restricts the cookie to HTTP connections only, disabling HTTPS",
            "It forces users to re-authenticate every hour"
        ],
        correct: 0,
        explanation: "HttpOnly cookies cannot be read by JavaScript. Even if an XSS vulnerability exists, the attacker cannot steal the session token via document.cookie."
    },
    {
        id: 35,
        question: "What is the difference between a vulnerability, a threat, and a risk in cybersecurity?",
        options: [
            "Vulnerability = weakness in a system; Threat = potential exploiter of that weakness; Risk = likelihood × impact of exploitation",
            "They all mean the same thing — a system weakness",
            "Threat = weakness; Vulnerability = attacker; Risk = software bug",
            "Risk = weakness; Vulnerability = impact; Threat = likelihood"
        ],
        correct: 0,
        explanation: "Understanding these distinctions guides prioritisation: a vulnerability with no realistic threat is low risk; the same vulnerability targeted by active attackers is high risk."
    }
]
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runnerQuestions, quizQuestions };
} else {
    window.runnerQuestions = runnerQuestions;
    window.quizQuestions = quizQuestions;
}

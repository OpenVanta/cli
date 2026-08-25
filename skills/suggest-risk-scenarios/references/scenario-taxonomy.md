# Risk scenario taxonomy

The candidate set this skill selects from — the only permitted source of
candidate scenarios. **Never invent a scenario that is not listed here.** If
the register needs coverage this file cannot supply, say so; that is a real
finding, not a prompt to improvise.

Each base scenario is neutral and company-agnostic: a failure mode, not a
finding about any organization. Customization into a Cause → Event → Impact
title happens in the skill, grounded in confirmed facts about the company.
"Always" in the applies-when column means the scenario fits any organization
operating information systems; any other signal must appear in retrieved data
or be stated by the user.

## Access & identity

| Base scenario | Applies when | CIA |
|---|---|---|
| Excessive or unnecessary access rights allow someone to reach systems or data beyond what their role requires. | Always | C, I |
| Access is not removed when someone changes role or leaves, leaving active credentials with no legitimate owner. | Always | C, I |
| Shared, default, or unmanaged credentials allow account use that cannot be attributed to an individual. | Always | C, I |
| A privileged administrative account is compromised, giving an attacker broad control over systems and data. | An identity provider, cloud platform, or admin console is in use | C, I |

## Data protection & confidentiality

| Base scenario | Applies when | CIA |
|---|---|---|
| Confidential data is exposed because it is stored or transmitted without adequate protection. | Always | C |
| Confidential data is copied into an unmanaged location — a personal device, a spreadsheet, a shadow tool — outside monitored systems. | Always | C |
| Data is retained longer than needed, widening what any single incident exposes. | Always | C |
| Data belonging to one customer becomes visible or modifiable by another because separation between tenants fails. | Multi-tenant product or shared-infrastructure service | C, I |

## Privacy & data governance

| Base scenario | Applies when | CIA |
|---|---|---|
| Personal data is collected or used in ways the applicable notices and consents do not cover. | A privacy framework is active, or personal data handling is confirmed | C |
| Privacy rights requests cannot be fulfilled in time because personal data locations and processing records are incomplete. | A privacy framework is active, or personal data handling is confirmed | C |
| Personal data is transferred or processed in locations the organization has not accounted for. | A privacy framework is active, or personal data handling is confirmed | C |

## Third-party & vendor

| Base scenario | Applies when | CIA |
|---|---|---|
| A third-party provider is compromised, exposing the organization's systems or data held by that provider. | Vendors are recorded, or third-party integrations are connected | C, I |
| A third party is granted access to confidential data without adequate review of how they protect it. | Vendors are recorded, or third-party integrations are connected | C |
| A third party the business depends on becomes unavailable or terminates service without adequate notice. | Vendors are recorded, or third-party integrations are connected | A |
| Services are adopted without procurement or security review, so the organization does not know what data they hold. | Discovered (unmanaged) vendors are present | C, I |

## Software development lifecycle

| Base scenario | Applies when | CIA |
|---|---|---|
| A change reaches production without adequate review or testing, introducing a defect or weakness. | Code repositories or a source-control integration are present | C, I |
| Credentials or keys are committed into source code or build configuration and become accessible beyond their intended audience. | Code repositories or a source-control integration are present | C |
| A third-party component or dependency contains a weakness that reaches production through the build process. | Code repositories, container images, or dependency scanning are present | C, I, A |
| The build and deployment pipeline is altered or misused to introduce unauthorized code into production. | A CI/CD or container build integration is present | C, I |

## Infrastructure & configuration

| Base scenario | Applies when | CIA |
|---|---|---|
| A storage location or service is configured to allow broader access than intended, exposing its contents. | Cloud infrastructure or servers are present | C |
| A production system is left reachable from untrusted networks without adequate protection. | Cloud infrastructure or servers are present | C, I, A |
| Systems run software with known unpatched weaknesses because patching does not keep pace with disclosure. | Servers, images, or a vulnerability scanner are present | C, I, A |
| Infrastructure or configuration is changed without review or a controlled process, degrading security or availability and leaving the environment undocumented. | Cloud infrastructure or servers are present | I, A |

## Availability, continuity & recovery

| Base scenario | Applies when | CIA |
|---|---|---|
| A failure in a single component or provider interrupts service because no alternative path exists. | The organization operates a customer-facing service | A |
| Demand or a deliberate flood of traffic exceeds capacity and the service becomes unavailable to legitimate users. | The organization operates a customer-facing service | A |
| Data is lost or a disruption outlasts what the business can absorb because backups and recovery plans are incomplete or untested. | Always | I, A |
| Critical operations depend on a small number of individuals whose unavailability halts the work. | Always | A |
| A destructive attack encrypts or deletes systems and data, stopping operations until they can be rebuilt. | Always | I, A |

## Endpoint & workforce devices

| Base scenario | Applies when | CIA |
|---|---|---|
| A workforce device is lost or stolen while holding confidential data that is not adequately protected. | Workforce members use laptops or mobile devices | C |
| A workforce device is compromised through malicious software and used as a route into company systems. | Workforce members use laptops or mobile devices | C, I |

## Personnel & insider

| Base scenario | Applies when | CIA |
|---|---|---|
| Someone with legitimate access deliberately takes or misuses confidential data. | Always | C, I |
| Someone with legitimate access causes harm accidentally through error or misconfiguration. | Always | C, I |
| Workforce members are deceived by social engineering into disclosing credentials or acting on fraudulent instructions. | Always | C |
| People take on responsibilities without the awareness or training the role requires, so security expectations are not met in practice. | Always | C, I |

## Detection, logging & response

| Base scenario | Applies when | CIA |
|---|---|---|
| Activity in key systems is not recorded, or its records can be altered by the same people they cover, so incidents cannot be reconstructed or attributed. | Always | I |
| An incident goes undetected because the signals that would reveal it are not collected or not reviewed. | Always | C, I, A |
| An incident is detected but the response is slow or inconsistent because roles and steps are not established in advance. | Always | C, I, A |
| Notification obligations to customers, partners, or authorities are missed or late because the trigger and process are unclear. | Always | C |

## Asset & physical

| Base scenario | Applies when | CIA |
|---|---|---|
| Systems or data stores exist that the organization does not know about, so they fall outside every control. | Always | C, I |
| Systems, accounts, or hardware are decommissioned or disposed of without confirming the data they held was removed. | Always | C |
| Someone gains physical access to a workspace or facility and reaches systems, documents, or devices. | The organization operates offices or facilities | C |

## Fraud & financial integrity

| Base scenario | Applies when | CIA |
|---|---|---|
| Records are created or altered without authorization because duties are not separated and changes are not supervised. | Always | I |
| Company assets or funds are misappropriated through misuse of legitimate access. | Always | C, I |
| Fraudulent or manipulated billing or payment instructions are acted on because approvals can be bypassed or requests are not verified through an independent channel. | Always | I |

## Legal, regulatory & contractual

| Base scenario | Applies when | CIA |
|---|---|---|
| Commitments made to customers in contracts are not met in practice because no one tracks them against operations. | Contracts or customer commitments are recorded | C, I |
| Regulatory obligations change and the organization does not adjust in time. | Any compliance framework is active | C, I |
| Claims made publicly about security or compliance posture overstate what is actually in place. | A compliance framework is active, or a public trust page is in use | C |

## AI

| Base scenario | Applies when | CIA |
|---|---|---|
| Confidential data is entered into an AI service and retained or used beyond the organization's intent. | An AI framework is active, an AI integration is connected, or AI use is confirmed | C |
| Output from an AI system is relied on for a decision without review, and the output is wrong. | An AI framework is active, an AI integration is connected, or AI use is confirmed | I |

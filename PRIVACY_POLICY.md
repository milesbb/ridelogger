# Privacy Policy

**Last updated: 16 May 2026**

RideLogger is operated as a tool for volunteer drivers. This policy explains how we manage personal information in accordance with the _Privacy Act 1988_ (Cth) and the Australian Privacy Principles (APPs).

---

## 1. Kinds of personal information we collect and hold

We collect and hold the following personal information:

**Account information**
- Email address
- Username
- Password (stored as a one-way bcrypt hash — we never store or see your plaintext password)

**Passenger profiles**
- Passenger name
- Passenger address (used for route planning)

**Saved locations**
- Location name
- Address

We do not collect sensitive information as defined under the Privacy Act (e.g. health, financial, or government identifier information).

---

## 2. How we collect personal information

We collect personal information directly from you when you:
- Create an account
- Create or edit a passenger profile
- Save a named location

We do not collect personal information from third parties or through automated means such as tracking pixels or analytics tools.

---

## 3. Purposes for collecting, holding, using, and disclosing personal information

We collect and use personal information solely to provide the RideLogger service, including:
- Authenticating your account and maintaining your session
- Storing and displaying your passenger profiles and saved locations
- Calculating routes and distances for drive planning

We do not use personal information for direct marketing, profiling, or any purpose beyond operating the service.

---

## 4. How we hold personal information and our security practices

All personal information is stored in a PostgreSQL database hosted on **AWS** in the **ap-southeast-2 (Sydney)** region.

Security measures include:
- Passwords are hashed using bcrypt before storage and are never stored or logged in plaintext
- Database connections are encrypted in transit (TLS)
- API secrets and credentials are stored in AWS SSM Parameter Store and are never hardcoded or logged
- Access tokens are short-lived (15 minutes) and stored only in your browser's `sessionStorage`, which is cleared when the browser tab is closed
- Session continuity uses a single httpOnly cookie (inaccessible to JavaScript) containing a hashed refresh token, valid for 30 days

We take reasonable steps to protect personal information from misuse, interference, loss, and unauthorised access, modification, or disclosure. When personal information is no longer needed, we will take reasonable steps to destroy or de-identify it.

---

## 5. Cookies

We set one cookie:

| Name | Purpose | Duration | Type |
|---|---|---|---|
| Refresh token | Maintains your authenticated session | 30 days | httpOnly — not accessible to JavaScript |

This cookie stores a securely hashed token, not your password or any personal information. It is strictly necessary for the service to function.

---

## 6. Disclosure of personal information overseas

We disclose personal information to the following overseas recipients as part of operating the service:

| Recipient | Country | Purpose | Privacy policy |
|---|---|---|---|
| **OpenRouteService** | Germany | Calculating routes and distances — addresses from your drive plan are sent to their API | [openrouteservice.org/privacy](https://ask.openrouteservice.org/privacy) |
| **Vercel** | United States | Hosting the web frontend — standard request metadata is processed per their privacy policy | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) |
| **AWS** | Australia (ap-southeast-2) and potentially other regions for infrastructure services | Hosting the API and database | [aws.amazon.com/privacy](https://aws.amazon.com/privacy) |

Before disclosing personal information to these overseas recipients, we take reasonable steps to ensure they handle information in a way consistent with the APPs. By using RideLogger, you acknowledge that your personal information may be disclosed overseas. Under APP 8.1, we remain accountable for how overseas recipients handle your information unless an exception under APP 8.2 applies.

---

## 7. Access to your personal information

Under APP 12, you have the right to request access to the personal information we hold about you. To make an access request, contact us directly (see section 10). We will respond within a reasonable time and may ask you to verify your identity before providing access.

We will not charge a fee for an access request, though reasonable fees may apply for providing access in some circumstances.

We may refuse access in limited circumstances permitted by the Privacy Act and will explain the reason for any refusal in writing.

---

## 8. Correction of your personal information

Under APP 13, if you believe personal information we hold about you is inaccurate, out of date, incomplete, irrelevant, or misleading, you may request correction by contacting us (see section 10). We will take reasonable steps to correct it within a reasonable time.

If we decline to correct the information, we will give you our reasons in writing and explain how you may complain about our decision.

---

## 9. Complaints

If you believe we have breached the APPs or the _Privacy Act 1988_, please contact us first (see section 10). We will investigate and respond within 30 days.

If you are not satisfied with our response, you may escalate your complaint to the **Office of the Australian Information Commissioner (OAIC)**:
- Website: [www.oaic.gov.au](https://www.oaic.gov.au)
- Phone: 1300 363 992
- Mail: GPO Box 5218, Sydney NSW 2001

---

## 10. Contact

For privacy enquiries, access or correction requests, or complaints, contact the RideLogger administrator directly.

---

## 11. Changes to this policy

We may update this policy from time to time. The **Last updated** date at the top will reflect any changes. Continued use of RideLogger after a material change constitutes acceptance of the updated policy.

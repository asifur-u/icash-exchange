export const steps = [
  {
    number: "01",
    title: "Choose a note",
    body: "Face value is in taka. Stock is the count of codes that are still unsold.",
  },
  {
    number: "02",
    title: "Pay on the hosted page",
    body: "This demonstration confirms the order on an iCash Exchange checkout page. A live gateway replaces it when you hold a merchant account.",
  },
  {
    number: "03",
    title: "Read the code",
    body: "The code appears on your order page. Email and SMS send once those providers are connected.",
  },
] as const;

export const faqs = [
  {
    q: "How fast does the code arrive?",
    a: "After payment is confirmed, the code is on your order page. In this demonstration that confirmation is immediate. Email and SMS follow when Resend and an SMS provider are configured.",
  },
  {
    q: "Can two people receive the same code?",
    a: "No. A code is reserved for one order, then marked sold. A second buyer cannot take it. Holds that stay unpaid for 15 minutes return to the desk.",
  },
  {
    q: "Where is the code stored?",
    a: "Encrypted at rest. It is decrypted for the delivery message and for the buyer’s order page. It is not written into logs, analytics, or the owner desk.",
  },
  {
    q: "Can a revealed code be refunded?",
    a: "A code that has been shown is voided, not sold again. Write the refund policy before a real launch. Digital codes are hard to take back.",
  },
  {
    q: "Are these notes real value?",
    a: "No. The codes on this desk are samples. They have no cash value. Connect a supplier you are allowed to resell, then replace the sample stock.",
  },
] as const;

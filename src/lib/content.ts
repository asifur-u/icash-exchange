export const steps = [
  {
    number: "01",
    title: "Choose a note",
    body: "Pick a face value in taka. The desk shows how many codes are still unsold.",
  },
  {
    number: "02",
    title: "Send the deposit",
    body: "Pay with bKash, Nagad, Rocket or bank. Add the transaction id and a screenshot so the desk can match it.",
  },
  {
    number: "03",
    title: "Read the code",
    body: "After the desk approves the deposit, the code is on your order page. Copy it from there.",
  },
] as const;

export const reasons = [
  {
    title: "One buyer, one code",
    body: "A code is held for a single order. Nobody else can take it while you pay.",
  },
  {
    title: "Local rails",
    body: "bKash, Nagad, Rocket and bank. The amount on the pay page is the amount you send.",
  },
  {
    title: "Proof, then the code",
    body: "The desk checks the transaction id and screenshot before the code is shown.",
  },
] as const;

export const faqs = [
  {
    q: "How fast does the code arrive?",
    a: "Once the desk matches your deposit, the code is on your order page. Keep that page open. You can copy the code from there.",
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
    a: "A code that has already been shown is closed. It is not sold to anyone else. Contact the desk before you reveal it if you need to stop the order.",
  },
  {
    q: "Which payments does the desk take?",
    a: "bKash, Nagad, Rocket and bank transfer. Send the exact total, then upload the transaction id and a screenshot on the pay page.",
  },
] as const;

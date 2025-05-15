## 📡 Sendexa SMPP Server

**Sendexa SMSC** is the official open-source SMPP (Short Message Peer-to-Peer) server powering **Sendexa**, a high-performance communications platform built in Ghana for Africa.

This project is part of our mission to build a **secure**, **scalable**, and **regulatory-compliant** messaging infrastructure without relying on third-party aggregators.

---

### 🧰 What’s Inside

```
sendexa-smsc/
├── smpp-core/         # Main server logic (sessions, bindings, PDUs)
├── countries/         # Telco-specific configs (MTN, Vodafone, AirtelTigo, Glo)
├── nca-compliance/    # DND, template approvals, profanity filtering
├── services/          # Rate limiter, queues, MSISDN validator
├── middlewares/       # Message enrichment, validation, etc.
├── configs/           # System & telco settings
├── utils/             # Logging, time, encoding helpers
├── logs/, tmp/        # Runtime data (gitignored)
```

---

### 🚀 Goals

* ✅ Handle **bind\_transceiver**, **submit\_sm**, **enquire\_link**, and **unbind**
* ✅ Telco-based routing & billing logic
* ✅ Ghana’s **NCA compliance** (e.g., DND, content filtering)
* ✅ Queuing and delivery simulation
* ✅ Fully TypeScript-based
* 🛠️ Docker support (coming soon)

---

### 🤝 Contributing

We’re calling on all backend engineers, protocol geeks, and telco-savvy devs to help us build Africa's most transparent and open SMS backbone.

**Ways you can contribute:**

* Help improve the PDU parsing & handling
* Add new telcos or country support
* Implement better queueing or delivery strategies
* Strengthen validation and security logic
* Write tests and improve DevOps integration

### 📦 Tech Stack

* Node.js + TypeScript
* [smpp](https://www.npmjs.com/package/smpp) package
* BullMQ (for message queues)
* ESLint + Prettier
* Docker (WIP)

---

### 🛡 Security Note

This repo is under **active development**. Avoid deploying it in production without understanding the risks. Contributors are encouraged to help improve security, rate limiting, and abuse detection.

---

### 📄 License

MIT License
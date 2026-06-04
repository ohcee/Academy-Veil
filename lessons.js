/**
 * VEIL ACADEMY — LESSONS DATA
 * ════════════════════════════
 * To add a lesson: copy the last object, increment the id, fill in your content.
 * To remove a lesson: delete the object. Everything else updates automatically.
 * To edit content: find the lesson by id and update body[] or quiz[].
 *
 * Body types: "p" (paragraph), "ul" (bullet list), "h" (subheading)
 * Quiz: each question has a prompt, options {a,b,c}, and answer ("a"|"b"|"c")
 */

const LESSONS = [
  {
    id: 1,
    title: "What is the Veil Project?",
    summary: "Privacy-first cryptocurrency combining RingCT, stealth addresses, and Dandelion++.",
    xp: 50,
    body: [
      { type: "p", text: "Veil is a privacy-focused cryptocurrency that launched in 2019. It uses a combination of RingCT and stealth addresses to keep amounts and participants private, along with Dandelion++ to obfuscate your IP address during transaction broadcasting." },
      { type: "p", text: "Veil has a maximum supply of 300 million coins and is powered by a hybrid 50/50 Proof-of-Stake and Proof-of-Work system." },
      { type: "h", text: "Proof-of-Work Split" },
      { type: "ul", items: [
        "ProgPoW — 35% of daily blocks (GPU mining)",
        "RandomX — 10% of daily blocks (CPU mining)",
        "SHA-256d — 5% of daily blocks (ASIC/FPGA mining)",
        "Staking — 50% of daily blocks"
      ]},
      { type: "p", text: "This combination supports decentralization across different hardware types while rewarding both miners and stakers." }
    ],
    quiz: [
      {
        prompt: "What does RingCT hide?",
        options: { a: "Only the sender", b: "The sender, receiver, and amount", c: "Only the fee" },
        answer: "b"
      },
      {
        prompt: "Which technologies does Veil use for privacy?",
        options: { a: "RingCT, stealth addresses, and Dandelion++", b: "SegWit and Lightning Network", c: "zk-SNARKs and Taproot" },
        answer: "a"
      },
      {
        prompt: "How is Veil's block reward distributed?",
        options: { a: "70% mining, 30% staking", b: "50% staking, 50% mining", c: "25% staking, 75% mining" },
        answer: "b"
      },
      {
        prompt: "Which Veil mining algorithm produces the most blocks daily?",
        options: { a: "SHA-256d", b: "RandomX", c: "ProgPoW" },
        answer: "c"
      }
    ]
  },
  {
    id: 2,
    title: "Setting Up the Core Wallet + Snapshot",
    summary: "Get the official wallet synced fast using a blockchain snapshot.",
    xp: 50,
    body: [
      { type: "p", text: "The Veil core wallet is the full-node client. It downloads and verifies every block on the chain. Using a snapshot skips initial sync, letting you get up and running in minutes instead of hours." },
      { type: "h", text: "Steps" },
      { type: "ul", items: [
        "Download the latest wallet from github.com/Veil-Project/veil/releases",
        "Download the current snapshot from veil.tools",
        "Close the wallet if open. Find your Veil data directory",
        "Extract the snapshot into the data directory, replacing the existing blocks/ and chainstate/ folders",
        "Restart the wallet — it will finish syncing from the snapshot tip"
      ]},
      { type: "h", text: "Data Directory Locations" },
      { type: "ul", items: [
        "Windows: %APPDATA%\\Veil",
        "macOS: ~/Library/Application Support/Veil",
        "Linux: ~/.veil"
      ]},
      { type: "p", text: "Never share your wallet.dat file. Back it up in a safe, offline location. Your wallet.dat contains your private keys — losing it means losing your funds." }
    ],
    quiz: [
      {
        prompt: "What does a blockchain snapshot allow you to skip?",
        options: { a: "Downloading the wallet", b: "Initial sync from block zero", c: "Creating a Veil address" },
        answer: "b"
      },
      {
        prompt: "Where is the Veil data directory on Linux?",
        options: { a: "~/.veil", b: "/usr/local/veil", c: "~/Documents/Veil" },
        answer: "a"
      },
      {
        prompt: "Which folder contains your private keys?",
        options: { a: "chainstate/", b: "blocks/", c: "wallet.dat" },
        answer: "c"
      },
      {
        prompt: "Where do you download official Veil releases?",
        options: { a: "veil-stats.com", b: "github.com/Veil-Project/veil/releases", c: "veil.tools" },
        answer: "b"
      }
    ]
  },
  {
    id: 3,
    title: "How RingCT Works",
    summary: "Ring signatures + Confidential Transactions — how Veil hides amounts and signers.",
    xp: 75,
    body: [
      { type: "p", text: "RingCT (Ring Confidential Transactions) combines two cryptographic primitives: ring signatures and Pedersen commitments." },
      { type: "h", text: "Ring Signatures" },
      { type: "p", text: "When you spend a RingCT output, your transaction is signed by a group (a 'ring') of outputs. An outside observer can see which ring was used but cannot determine which member of the ring is the actual signer." },
      { type: "h", text: "Confidential Transactions (Pedersen Commitments)" },
      { type: "p", text: "Amounts are hidden using Pedersen commitments — a cryptographic scheme that lets the network verify inputs equal outputs (no coins created from thin air) without revealing the actual values." },
      { type: "h", text: "Together" },
      { type: "ul", items: [
        "Who spent: hidden by ring signature (one-of-many ambiguity)",
        "How much: hidden by Pedersen commitment",
        "Where funds went: hidden by stealth addresses on the receiving side"
      ]}
    ],
    quiz: [
      {
        prompt: "What does the ring in a ring signature provide?",
        options: { a: "Faster transaction speeds", b: "Ambiguity about which member signed", c: "Lower transaction fees" },
        answer: "b"
      },
      {
        prompt: "What cryptographic tool hides transaction amounts in RingCT?",
        options: { a: "zk-SNARKs", b: "Schnorr signatures", c: "Pedersen commitments" },
        answer: "c"
      },
      {
        prompt: "Can a network node verify inputs equal outputs without seeing amounts?",
        options: { a: "Yes, using Pedersen commitments", b: "No, amounts must be visible", c: "Only validators can see amounts" },
        answer: "a"
      },
      {
        prompt: "What hides the recipient's address in a Veil RingCT transaction?",
        options: { a: "Ring signatures", b: "Stealth addresses", c: "Bulletproofs" },
        answer: "b"
      }
    ]
  },
  {
    id: 4,
    title: "How to Stake Veil",
    summary: "Earn block rewards by staking RingCT mints in your always-on wallet.",
    xp: 50,
    body: [
      { type: "p", text: "Staking is Veil's Proof-of-Stake mechanism. Stakers earn 50% of all block rewards. To stake you need RingCT minted outputs (Zerocoin mints) in your wallet and the wallet must be open and unlocked for staking." },
      { type: "h", text: "Requirements" },
      { type: "ul", items: [
        "Veil core wallet, fully synced",
        "RingCT minted balance (not basecoin or CT)",
        "Wallet unlocked for staking (not for sending)",
        "Stable internet connection — wallet should stay online"
      ]},
      { type: "h", text: "How to Unlock for Staking Only" },
      { type: "p", text: "In the wallet GUI: Settings → Unlock Wallet → check 'For staking only'. In the debug console: walletpassphrase \"yourpassphrase\" 0 true — the third argument (true) means staking-only." },
      { type: "p", text: "Your staking weight equals the size of your eligible minted balance. The more you have minted, the more often you'll find a block." }
    ],
    quiz: [
      {
        prompt: "What percentage of block rewards do stakers earn?",
        options: { a: "25%", b: "50%", c: "75%" },
        answer: "b"
      },
      {
        prompt: "Which balance type is eligible for staking?",
        options: { a: "Basecoin", b: "CT outputs", c: "RingCT mints" },
        answer: "c"
      },
      {
        prompt: "What does the third argument 'true' mean in walletpassphrase?",
        options: { a: "Full unlock", b: "Staking only", c: "Send only" },
        answer: "b"
      },
      {
        prompt: "What determines your staking weight?",
        options: { a: "Your wallet version", b: "How long you've staked", c: "The size of your minted balance" },
        answer: "c"
      }
    ]
  },
  {
    id: 5,
    title: "Where to Get Veil",
    summary: "Exchanges, mining, staking, and the faucet — all the ways to acquire VEIL.",
    xp: 50,
    body: [
      { type: "p", text: "There are several ways to acquire Veil. Each has different tradeoffs between ease, privacy, and effort." },
      { type: "h", text: "Exchanges" },
      { type: "p", text: "Veil is listed on a number of exchanges. Check veil-project.com for the current list. CEX purchases are fastest but require KYC." },
      { type: "h", text: "Mining" },
      { type: "p", text: "Mine with your GPU (ProgPoW), CPU (RandomX), or ASIC (SHA-256d). Mining rewards go to your wallet address directly. See Lesson 9 for full mining setup." },
      { type: "h", text: "Staking" },
      { type: "p", text: "If you already hold Veil, staking earns additional VEIL passively. See Lesson 4." },
      { type: "h", text: "Veil Academy Faucet" },
      { type: "p", text: "Complete lessons and pass quizzes to earn small VEIL amounts directly from this site. The faucet sends RingCT — fully private, no KYC. Up to 10 VEIL per day per IP." }
    ],
    quiz: [
      {
        prompt: "Which algorithm is used for CPU mining on Veil?",
        options: { a: "ProgPoW", b: "RandomX", c: "SHA-256d" },
        answer: "b"
      },
      {
        prompt: "What is the Veil Academy faucet daily cap per IP?",
        options: { a: "5 VEIL", b: "25 VEIL", c: "10 VEIL" },
        answer: "c"
      },
      {
        prompt: "In what form does the Veil Academy faucet send rewards?",
        options: { a: "Basecoin", b: "RingCT", c: "CT" },
        answer: "b"
      },
      {
        prompt: "What is the maximum Veil supply?",
        options: { a: "21 million", b: "300 million", c: "1 billion" },
        answer: "b"
      }
    ]
  },
  {
    id: 6,
    title: "Basecoin vs Stealth vs RingCT",
    summary: "Understanding Veil's three transaction types and when each is used.",
    xp: 75,
    body: [
      { type: "p", text: "Veil has three coin/transaction types. They provide different levels of privacy." },
      { type: "h", text: "Basecoin" },
      { type: "p", text: "Transparent — amounts and addresses are visible on the blockchain. Similar to Bitcoin transactions. Avoid holding basecoin; convert to RingCT for full privacy." },
      { type: "h", text: "Stealth (CT)" },
      { type: "p", text: "Confidential Transaction outputs. Amounts are hidden but the transaction graph is still visible — an observer can see that a transaction occurred between two parties. An intermediate layer." },
      { type: "h", text: "RingCT" },
      { type: "p", text: "Maximum privacy. Both amounts and the sender's identity are hidden using ring signatures and Pedersen commitments. The recommended type for all Veil holdings. RingCT outputs are also required for staking." },
      { type: "h", text: "Auto-Convert" },
      { type: "p", text: "The wallet can be configured to automatically convert basecoin and CT outputs to RingCT on each block. Keeping all your balance in RingCT is best practice." }
    ],
    quiz: [
      {
        prompt: "Which transaction type exposes amounts and addresses on-chain?",
        options: { a: "RingCT", b: "CT (Stealth)", c: "Basecoin" },
        answer: "c"
      },
      {
        prompt: "CT (Stealth) hides which of the following?",
        options: { a: "Transaction amounts only", b: "Both amounts and sender identity", c: "Nothing" },
        answer: "a"
      },
      {
        prompt: "Which type is required for staking?",
        options: { a: "Basecoin", b: "RingCT", c: "CT" },
        answer: "b"
      },
      {
        prompt: "What does auto-convert do?",
        options: { a: "Sends your Veil to an exchange", b: "Converts basecoin and CT to RingCT automatically", c: "Converts RingCT to basecoin" },
        answer: "b"
      }
    ]
  },
  {
    id: 7,
    title: "Minting for Staking",
    summary: "Convert your Veil to RingCT mints to activate staking eligibility.",
    xp: 75,
    body: [
      { type: "p", text: "To stake Veil, your balance must be in RingCT minted form. This is the process of converting standard outputs into Zerocoin-based mints that the staking engine can use." },
      { type: "h", text: "Why Mint?" },
      { type: "p", text: "RingCT mints are the unit of stake weight. Each mint denomination has a specific size. Having more minted balance = higher probability of finding the next staking block." },
      { type: "h", text: "How to Mint" },
      { type: "ul", items: [
        "In the wallet: go to the Privacy tab or use the Mint action",
        "Select the amount to mint — choosing denominations wisely improves efficiency (see Lesson 8)",
        "Wait for the mint to mature (200 confirmations before it's eligible to stake)",
        "Once mature, the wallet will automatically attempt to stake with those mints"
      ]},
      { type: "p", text: "Minting is a one-way step within a session — mints cannot be 'unminted' back into transparent outputs without spending them." }
    ],
    quiz: [
      {
        prompt: "How many confirmations must a mint reach before it can stake?",
        options: { a: "6", b: "100", c: "200" },
        answer: "c"
      },
      {
        prompt: "What determines your probability of finding a staking block?",
        options: { a: "Your IP location", b: "Your minted balance size", c: "Your wallet version" },
        answer: "b"
      },
      {
        prompt: "Can you 'unmint' a mint back to transparent outputs without spending it?",
        options: { a: "Yes", b: "No", c: "Only with a passphrase" },
        answer: "b"
      },
      {
        prompt: "Where do you initiate minting in the core wallet?",
        options: { a: "The Send tab", b: "The Privacy tab", c: "The Settings menu" },
        answer: "b"
      }
    ]
  },
  {
    id: 8,
    title: "Denominations & Efficiency",
    summary: "Why denomination choice affects transaction fees and staking efficiency.",
    xp: 75,
    body: [
      { type: "p", text: "RingCT mints come in fixed denominations. Choosing the right denomination mix matters for both fee efficiency and staking performance." },
      { type: "h", text: "Available Denominations" },
      { type: "ul", items: [
        "0.05 VEIL", "0.1 VEIL", "0.5 VEIL", "1 VEIL", "10 VEIL",
        "100 VEIL", "1,000 VEIL", "10,000 VEIL", "100,000 VEIL"
      ]},
      { type: "h", text: "Why It Matters" },
      { type: "p", text: "Larger denominations mean fewer mints to manage — lower fees when spending, less blockchain data, and simpler UTXO sets. However, very large denominations can be inefficient if you need to make change frequently." },
      { type: "p", text: "For staking, the denomination itself doesn't matter — what matters is total minted value. Use larger denominations when possible and consolidate small outputs periodically." }
    ],
    quiz: [
      {
        prompt: "What is the largest available RingCT denomination?",
        options: { a: "10,000 VEIL", b: "100,000 VEIL", c: "1,000,000 VEIL" },
        answer: "b"
      },
      {
        prompt: "Why are larger denominations generally preferred?",
        options: { a: "They earn more staking rewards", b: "They result in lower fees and fewer UTXOs", c: "They are more private" },
        answer: "b"
      },
      {
        prompt: "For staking weight, which matters more?",
        options: { a: "Individual denomination size", b: "Total minted value", c: "Number of mints" },
        answer: "b"
      },
      {
        prompt: "What is the smallest available denomination?",
        options: { a: "0.01 VEIL", b: "0.05 VEIL", c: "0.1 VEIL" },
        answer: "b"
      }
    ]
  },
  {
    id: 9,
    title: "Mining Algorithms",
    summary: "ProgPoW, RandomX, and SHA-256d — hardware options and solo vs pool mining.",
    xp: 75,
    body: [
      { type: "p", text: "Veil supports three PoW algorithms simultaneously. Each targets different hardware, promoting mining decentralization." },
      { type: "h", text: "ProgPoW (GPU)" },
      { type: "p", text: "Programmatic Proof-of-Work. Designed to leverage the full capabilities of consumer GPUs. Produces 35% of daily blocks. Nvidia and AMD GPUs both work. Use miners like T-Rex or TeamRedMiner." },
      { type: "h", text: "RandomX (CPU)" },
      { type: "p", text: "CPU-optimized algorithm using random code execution. Produces 10% of daily blocks. CPUs with large L3 cache perform best (AMD Ryzen/EPYC preferred). Use XMRig." },
      { type: "h", text: "SHA-256d (ASIC)" },
      { type: "p", text: "Bitcoin-compatible SHA-256 double. Produces 5% of daily blocks. Standard Bitcoin ASICs can mine this algorithm." },
      { type: "h", text: "Solo vs Pool" },
      { type: "p", text: "Solo mining sends rewards directly to your wallet with no pool fees, but variance is high — you may go long periods without a block. Pool mining smooths rewards. Check veil-stats.com for active pools." }
    ],
    quiz: [
      {
        prompt: "Which algorithm is designed for GPU mining?",
        options: { a: "RandomX", b: "SHA-256d", c: "ProgPoW" },
        answer: "c"
      },
      {
        prompt: "What percentage of daily blocks does RandomX target?",
        options: { a: "5%", b: "10%", c: "35%" },
        answer: "b"
      },
      {
        prompt: "Which CPU brand has an edge in RandomX due to larger L3 cache?",
        options: { a: "Intel", b: "AMD", c: "Qualcomm" },
        answer: "b"
      },
      {
        prompt: "What is the main tradeoff with solo mining vs pool mining?",
        options: { a: "Solo has higher fees", b: "Solo has higher reward variance", c: "Pool mining requires more hardware" },
        answer: "b"
      }
    ]
  },
  {
    id: 10,
    title: "Staking Zerocoin Mints",
    summary: "Deep dive into how the staking engine selects and spends mints.",
    xp: 100,
    body: [
      { type: "p", text: "Veil's staking mechanism uses Zerocoin mints as stake inputs. Understanding how the engine works helps you optimize your setup." },
      { type: "h", text: "How the Staking Engine Works" },
      { type: "ul", items: [
        "Every block, the wallet scans your mature mints",
        "It computes a hash combining the mint's serial number, the current block hash, and a modifier",
        "If the hash meets the current difficulty target, your wallet wins the block",
        "The winning mint is spent (a new mint of the same denomination is created as change)"
      ]},
      { type: "h", text: "Optimizing" },
      { type: "ul", items: [
        "Keep the wallet running 24/7 — you can't stake when offline",
        "More minted balance = more attempts per block = more wins",
        "Ensure all mints have 200+ confirmations (immature mints don't stake)",
        "Use a stable power connection — unexpected shutdowns can delay staking"
      ]},
      { type: "p", text: "Staking rewards are added as new RingCT mints to your wallet and are immediately eligible after maturing." }
    ],
    quiz: [
      {
        prompt: "What three values are combined in the staking hash?",
        options: { a: "Address, balance, timestamp", b: "Mint serial, block hash, modifier", c: "IP, wallet ID, block height" },
        answer: "b"
      },
      {
        prompt: "What happens to the mint that wins a staking block?",
        options: { a: "It is destroyed", b: "It is locked for 24 hours", c: "It is spent and new change mints are created" },
        answer: "c"
      },
      {
        prompt: "Why should you keep the wallet online 24/7?",
        options: { a: "To receive updates", b: "Because staking only happens while online", c: "To back up the wallet" },
        answer: "b"
      },
      {
        prompt: "How many confirmations must a mint have to be eligible for staking?",
        options: { a: "6", b: "200", c: "1000" },
        answer: "b"
      }
    ]
  },
  {
    id: 11,
    title: "How to Contribute",
    summary: "Getting involved — code, testing, docs, community, and running a node.",
    xp: 100,
    body: [
      { type: "p", text: "Veil is an open-source project. There are many ways to contribute regardless of your technical background." },
      { type: "h", text: "Code Contributions" },
      { type: "p", text: "The core wallet is C++ (Bitcoin-derived). Fork Veil-Project/veil on GitHub, create a feature branch, and open a PR. Check open Issues for tasks tagged 'help wanted'. Follow the CONTRIBUTING.md guidelines." },
      { type: "h", text: "Testing" },
      { type: "p", text: "Run the latest builds, report bugs with reproduction steps on GitHub Issues. Test PRs before they merge — this is one of the highest-value contributions." },
      { type: "h", text: "Documentation & Education" },
      { type: "p", text: "Write guides, update the wiki, create videos, or expand Veil Academy. Clear documentation lowers the barrier for new users." },
      { type: "h", text: "Community" },
      { type: "p", text: "Help answer questions in Discord and Telegram. Onboard new users. Run a full node to strengthen the network." },
      { type: "h", text: "Running a Full Node" },
      { type: "p", text: "Every full node strengthens decentralization. Ensure port 58810 (mainnet) is forwarded on your router to allow inbound connections." }
    ],
    quiz: [
      {
        prompt: "What language is the Veil core wallet written in?",
        options: { a: "Rust", b: "Go", c: "C++" },
        answer: "c"
      },
      {
        prompt: "What port should be forwarded for a Veil mainnet full node?",
        options: { a: "8333", b: "58810", c: "18333" },
        answer: "b"
      },
      {
        prompt: "Where do you report bugs or find 'help wanted' tasks?",
        options: { a: "The Veil Discord only", b: "GitHub Issues", c: "The wallet debug console" },
        answer: "b"
      },
      {
        prompt: "What is one of the highest-value non-code contributions?",
        options: { a: "Running advertisements", b: "Testing PRs before they merge", c: "Mining with SHA-256d" },
        answer: "b"
      }
    ]
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns total XP available across all lessons */
function totalXP() {
  return LESSONS.reduce((sum, l) => sum + l.xp, 0);
}

/** Returns a lesson by id (1-indexed) */
function getLessonById(id) {
  return LESSONS.find(l => l.id === id) || null;
}

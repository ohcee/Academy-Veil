/**
 * VEIL ACADEMY — LESSONS DATA (PUBLIC)
 * ═════════════════════════════════════
 * This file ships to the browser. It deliberately contains NO quiz answers —
 * the answer key lives only on the faucet server (see answers.example.json).
 * If answers were here, anyone could read them in View Source and farm the faucet.
 *
 * To add a lesson: copy the last object, increment the id, fill in your content,
 * then add a matching entry to the server's answers.json.
 *
 * Body block types:
 *   { type: "p",    text: "..." }              paragraph
 *   { type: "h",    text: "..." }              subheading
 *   { type: "ul",   items: ["...", "..."] }    bullet list
 *   { type: "note", text: "..." }              callout box
 *   { type: "code", text: "..." }              monospace block
 *
 * Quiz: each question has a prompt and options {a,b,c}. No answer field.
 *
 * Accuracy policy: every factual claim below is checked against Veil core at the
 * current release (v1.4.2.0). Where a feature is proposed but not yet merged, the
 * lesson says so explicitly and links the PR. Do not describe unmerged behaviour
 * as if it ships today.
 */

const LESSONS = [
  {
    id: 1,
    title: "What is the Veil Project?",
    summary: "Privacy-first cryptocurrency combining RingCT, stealth addresses, and Dandelion++.",
    xp: 50,
    body: [
      { type: "p", text: "Veil is a privacy-focused cryptocurrency that launched on 1 January 2019. It combines RingCT and stealth addresses to hide amounts and participants, and uses Dandelion++ to obscure which node originated a transaction when it is broadcast." },
      { type: "p", text: "Veil has a maximum supply of 300 million coins and runs a hybrid system: half of all blocks are produced by Proof-of-Stake, the other half by three separate Proof-of-Work algorithms." },
      { type: "h", text: "How the 50/50 split actually works" },
      { type: "p", text: "Veil does not pick an algorithm at random. Each algorithm has its own target block spacing, and difficulty adjusts independently to hold that spacing. Proof-of-Work and Proof-of-Stake blocks alternate, so the daily block counts fall out of the arithmetic:" },
      { type: "ul", items: [
        "ProgPoW — one block every 172 seconds — about 35% of daily blocks (GPU mining)",
        "RandomX — one block every 600 seconds — about 10% of daily blocks (CPU mining)",
        "SHA-256d — one block every 1200 seconds — about 5% of daily blocks (ASIC mining)",
        "Staking — the remaining 50% of daily blocks"
      ]},
      { type: "note", text: "You can verify this yourself: the target spacings are set in src/chainparams.cpp as nProgPowTargetSpacing = 172, nRandomXTargetSpacing = 600, and nSha256DTargetSpacing = 1200." },
      { type: "h", text: "Emission" },
      { type: "p", text: "The block reward started at 50 VEIL and steps down over time. It is currently 10 VEIL per block. New coin creation stops entirely at block height 9,816,000, which lands very close to the 300 million cap. A portion of the emission is directed to the project budget and foundation at periodic superblocks rather than to the individual miner or staker." },
      { type: "p", text: "Running three PoW algorithms alongside staking spreads block production across GPUs, CPUs, ASICs, and coin holders, so no single class of hardware can dominate the chain." }
    ],
    sources: [
      { label: "chainparams.cpp — target spacings and supply stop", url: "https://github.com/Veil-Project/veil/blob/master/src/chainparams.cpp" },
      { label: "amount.h — MAX_MONEY = 300,000,000", url: "https://github.com/Veil-Project/veil/blob/master/src/amount.h" }
    ],
    quiz: [
      {
        prompt: "What does RingCT hide?",
        options: { a: "Only the sender", b: "The sender, receiver, and amount", c: "Only the fee" }
      },
      {
        prompt: "Which technologies does Veil use for privacy?",
        options: { a: "RingCT, stealth addresses, and Dandelion++", b: "SegWit and Lightning Network", c: "zk-SNARKs and Taproot" }
      },
      {
        prompt: "Roughly how are Veil's daily blocks split between staking and mining?",
        options: { a: "70% mining, 30% staking", b: "50% staking, 50% mining", c: "25% staking, 75% mining" }
      },
      {
        prompt: "Which Veil mining algorithm produces the most blocks per day?",
        options: { a: "SHA-256d", b: "RandomX", c: "ProgPoW" }
      },
      {
        prompt: "Why does ProgPoW produce more daily blocks than SHA-256d?",
        options: { a: "It has a shorter target block spacing (172s vs 1200s)", b: "GPUs are faster than ASICs", c: "The network picks it more often at random" }
      }
    ]
  },
  {
    id: 2,
    title: "Setting Up the Core Wallet + Snapshot",
    summary: "Get the official wallet synced fast using a blockchain snapshot — and understand the tradeoff.",
    xp: 50,
    body: [
      { type: "p", text: "The Veil core wallet is a full-node client. By default it downloads every block from genesis and verifies it independently. That is the strongest security model available to you, but the initial sync takes hours." },
      { type: "p", text: "A snapshot is a pre-built copy of the block and chainstate databases. Dropping one in lets you skip most of that verification and start near the chain tip in minutes." },
      { type: "note", text: "Understand the tradeoff before you use one. A snapshot means you are trusting whoever produced it instead of verifying the chain yourself. Only use snapshots from sources you trust, and if you are storing meaningful value, consider syncing from genesis at least once." },
      { type: "h", text: "Steps" },
      { type: "ul", items: [
        "Download the latest wallet release from github.com/Veil-Project/veil/releases and verify the checksum",
        "Download the current snapshot from veil.tools",
        "Close the wallet completely if it is open",
        "Extract the snapshot into your data directory, replacing the existing blocks/ and chainstate/ folders",
        "Restart the wallet — it will sync the remaining blocks from the snapshot's tip"
      ]},
      { type: "h", text: "Data directory locations" },
      { type: "ul", items: [
        "Windows: %APPDATA%\\Veil",
        "macOS: ~/Library/Application Support/Veil",
        "Linux: ~/.veil"
      ]},
      { type: "h", text: "Protecting your keys" },
      { type: "p", text: "Your wallet.dat file contains your private keys. Never share it, never paste it anywhere, and never store it in cloud sync alongside your passphrase. Back it up to offline media. If you lose wallet.dat and have no backup, your funds are gone — there is no recovery service and no one who can restore them for you." },
      { type: "p", text: "Encrypt your wallet with a strong passphrase. Write the passphrase down and store it separately from the backup. An encrypted backup you cannot decrypt is the same as no backup." }
    ],
    sources: [
      { label: "Official releases", url: "https://github.com/Veil-Project/veil/releases" }
    ],
    quiz: [
      {
        prompt: "What does a blockchain snapshot let you skip?",
        options: { a: "Downloading the wallet", b: "Verifying the chain yourself from block zero", c: "Creating a Veil address" }
      },
      {
        prompt: "What is the security tradeoff of using a snapshot?",
        options: { a: "There is none, it is strictly better", b: "You trust the snapshot's producer instead of verifying yourself", c: "It makes your transactions less private" }
      },
      {
        prompt: "Where is the Veil data directory on Linux?",
        options: { a: "~/.veil", b: "/usr/local/veil", c: "~/Documents/Veil" }
      },
      {
        prompt: "Which file contains your private keys?",
        options: { a: "chainstate/", b: "blocks/", c: "wallet.dat" }
      },
      {
        prompt: "Where do you download official Veil releases?",
        options: { a: "veil-stats.com", b: "github.com/Veil-Project/veil/releases", c: "veil.tools" }
      }
    ]
  },
  {
    id: 3,
    title: "How RingCT Works",
    summary: "Ring signatures + Confidential Transactions — how Veil hides amounts and signers.",
    xp: 75,
    body: [
      { type: "p", text: "RingCT (Ring Confidential Transactions) is built from two separate cryptographic ideas working together: ring signatures, which hide who is spending, and Pedersen commitments, which hide how much." },
      { type: "h", text: "Ring signatures — hiding the spender" },
      { type: "p", text: "When you spend a RingCT output, the signature is produced over a set of outputs called a ring. Your real output is one member; the others are decoys pulled from the chain. Any observer can see the whole ring, and can verify that exactly one member signed, but cannot tell which one." },
      { type: "p", text: "The default ring size in Veil is 4, and it is adjustable per transaction. A larger ring means a larger anonymity set for that input, at the cost of a larger transaction." },
      { type: "h", text: "Pedersen commitments — hiding the amount" },
      { type: "p", text: "Instead of publishing the amount, a RingCT output publishes a commitment to it. Commitments are additively homomorphic: the network can add up the input commitments and the output commitments and check that they balance, proving no coins were created from thin air, without ever learning a single value." },
      { type: "h", text: "Range proofs — the missing piece" },
      { type: "p", text: "Hidden amounts create a problem: a negative amount would let someone mint coins while still balancing the equation. Range proofs close that hole by proving each committed amount falls inside a valid range. Veil uses Bulletproofs, a compact range proof scheme, so this protection costs relatively little block space." },
      { type: "h", text: "Putting it together" },
      { type: "ul", items: [
        "Who spent — hidden by the ring signature (one-of-many ambiguity)",
        "How much — hidden by the Pedersen commitment",
        "That the amount is legitimate — guaranteed by the Bulletproof range proof",
        "Who received — hidden by the stealth address on the receiving side"
      ]}
    ],
    quiz: [
      {
        prompt: "What does the ring in a ring signature provide?",
        options: { a: "Faster transaction speeds", b: "Ambiguity about which member actually signed", c: "Lower transaction fees" }
      },
      {
        prompt: "What cryptographic tool hides transaction amounts in RingCT?",
        options: { a: "zk-SNARKs", b: "Schnorr signatures", c: "Pedersen commitments" }
      },
      {
        prompt: "Can a node verify that inputs equal outputs without seeing the amounts?",
        options: { a: "Yes — commitments add up homomorphically", b: "No, amounts must be visible", c: "Only validators can see amounts" }
      },
      {
        prompt: "What stops someone from hiding a negative amount to mint coins?",
        options: { a: "Ring signatures", b: "Bulletproof range proofs", c: "Stealth addresses" }
      },
      {
        prompt: "What hides the recipient in a Veil RingCT transaction?",
        options: { a: "Ring signatures", b: "Stealth addresses", c: "Bulletproofs" }
      }
    ]
  },
  {
    id: 4,
    title: "How to Stake Veil",
    summary: "Earn block rewards by staking Zerocoin mints in an always-on wallet.",
    xp: 50,
    body: [
      { type: "p", text: "Staking is Veil's Proof-of-Stake mechanism, and it produces half of all blocks on the chain. To stake, you need mature Zerocoin mints in your wallet and the wallet must be running and unlocked for staking." },
      { type: "note", text: "Important distinction: staking today uses Zerocoin mints, not RingCT outputs. These are two different output types in Veil. RingCT balances cannot stake at present. RingCT staking is an open proposal (PR #1019) and is not part of the released wallet — see Lesson 6." },
      { type: "h", text: "Requirements" },
      { type: "ul", items: [
        "Veil core wallet, fully synced",
        "A balance of Zerocoin mints with at least 1000 confirmations",
        "Wallet unlocked for staking only — not fully unlocked",
        "The wallet running continuously; you cannot stake while offline"
      ]},
      { type: "h", text: "Unlocking for staking only" },
      { type: "p", text: "Staking-only unlock lets the wallet sign stake blocks without being able to send your funds. If your machine is compromised while fully unlocked, an attacker can spend everything; staking-only unlock significantly limits that damage. Always prefer it." },
      { type: "p", text: "In the GUI: Settings → Unlock Wallet, and tick the staking-only option. In the debug console the command is:" },
      { type: "code", text: "walletpassphrase \"your passphrase\" true 0" },
      { type: "p", text: "The arguments are, in order: the passphrase, then unlockforstakingonly as a boolean, then the timeout in seconds. A timeout of 0 means no automatic re-lock, which is what you want for a machine dedicated to staking." },
      { type: "note", text: "Watch the argument order. The staking-only flag is the SECOND argument, before the timeout. Older guides sometimes show the passphrase, timeout, then the flag — that order is wrong for Veil and the command will not do what you expect." },
      { type: "h", text: "Staking weight" },
      { type: "p", text: "Your chance of winning a block scales with the total value you have in mature mints. More minted value means more weight; the size of any individual mint does not change your odds beyond the value it contributes." }
    ],
    sources: [
      { label: "rpcwallet.cpp — walletpassphrase signature", url: "https://github.com/Veil-Project/veil/blob/master/src/wallet/rpcwallet.cpp" }
    ],
    quiz: [
      {
        prompt: "What share of Veil blocks are produced by staking?",
        options: { a: "25%", b: "50%", c: "75%" }
      },
      {
        prompt: "Which balance type can stake on Veil today?",
        options: { a: "Basecoin", b: "RingCT outputs", c: "Zerocoin mints" }
      },
      {
        prompt: "In walletpassphrase, which argument position is the staking-only flag?",
        options: { a: "First, before the passphrase", b: "Second, before the timeout", c: "Third, after the timeout" }
      },
      {
        prompt: "Why unlock for staking only rather than fully unlocking?",
        options: { a: "It stakes faster", b: "A compromised machine cannot spend your funds", c: "It is required by consensus rules" }
      },
      {
        prompt: "What determines your staking weight?",
        options: { a: "Your wallet version", b: "How long you have staked", c: "The total value of your mature mints" }
      }
    ]
  },
  {
    id: 5,
    title: "Where to Get Veil",
    summary: "Exchanges, mining, staking, and this faucet — the tradeoffs of each.",
    xp: 50,
    body: [
      { type: "p", text: "There are several ways to acquire Veil, and they differ sharply in how much privacy you give up." },
      { type: "h", text: "Exchanges" },
      { type: "p", text: "Veil is listed on a number of exchanges; check veil-project.com for the current list. Centralised exchanges are the fastest route but require KYC, which permanently links your identity to the coins you withdraw. If you then move those coins into RingCT, the exchange still holds a record of the withdrawal." },
      { type: "h", text: "Mining" },
      { type: "p", text: "Mine with a GPU (ProgPoW), a CPU (RandomX), or SHA-256 ASICs. Mining rewards are paid to a basecoin address that you configure as your mining address. See Lesson 9 for setup." },
      { type: "h", text: "Staking" },
      { type: "p", text: "If you already hold Veil, staking earns more of it without any counterparty at all. See Lesson 4." },
      { type: "h", text: "This faucet" },
      { type: "p", text: "Pass a lesson quiz and this site sends you 1 VEIL, up to a cap of 10 VEIL per day. It is a way to get a working balance with no exchange account and no KYC, so you can practise minting, staking, and sending for real." },
      { type: "note", text: "Faucet privacy: payouts are sent to your stealth address as RingCT. This site records only a salted hash of your IP address for rate limiting, never the address you were paid to, and never a link between the two. Even so, the strongest habit is to treat any address you post into a website as a public address — use a fresh one." }
    ],
    quiz: [
      {
        prompt: "Which algorithm is used for CPU mining on Veil?",
        options: { a: "ProgPoW", b: "RandomX", c: "SHA-256d" }
      },
      {
        prompt: "What is this faucet's daily cap?",
        options: { a: "5 VEIL", b: "25 VEIL", c: "10 VEIL" }
      },
      {
        prompt: "What is the main privacy cost of buying Veil on a centralised exchange?",
        options: { a: "Higher fees", b: "KYC permanently links your identity to the coins you withdraw", c: "Slower withdrawals" }
      },
      {
        prompt: "What address type do mining rewards get paid to?",
        options: { a: "A basecoin address you set as your mining address", b: "A stealth address", c: "Any address type works" }
      },
      {
        prompt: "What is the maximum Veil supply?",
        options: { a: "21 million", b: "300 million", c: "1 billion" }
      }
    ]
  },
  {
    id: 6,
    title: "Coin Types and Where Veil Is Heading",
    summary: "Basecoin, CT, RingCT and Zerocoin — what each is for today, and the RingCT-only direction.",
    xp: 75,
    body: [
      { type: "p", text: "Veil has more than one kind of output, and knowing which is which matters for both privacy and staking. Today there are four you will encounter." },
      { type: "h", text: "The four output types" },
      { type: "ul", items: [
        "Basecoin — transparent, like Bitcoin. Amount and address are public. Used for mining payouts. Addresses begin with bv.",
        "CT (stealth) — the amount is hidden by a Pedersen commitment and the recipient by a stealth address, but the sender's input is traceable.",
        "RingCT — full privacy: sender hidden by a ring signature, amount hidden by a commitment, recipient hidden by a stealth address.",
        "Zerocoin mints — fixed-denomination mints. These are what stakes today."
      ]},
      { type: "note", text: "RingCT and Zerocoin mints are not the same thing, and the terms are often mixed up. RingCT is Veil's private transaction type. Zerocoin mints are the fixed-denomination outputs the staking engine consumes. Lessons 7, 8 and 10 are about Zerocoin mints." },
      { type: "h", text: "Which address should you give out?" },
      { type: "p", text: "Give out your stealth address, which begins with sv. Every payment to a stealth address lands on a fresh one-time output, so two people paying you cannot tell they paid the same person by looking at the chain. A basecoin address does not have that property — reusing one publishes a linkable history of everything it ever received." },
      { type: "h", text: "The RingCT-only direction" },
      { type: "p", text: "Multiple coexisting output types weaken the network's privacy overall. Every transparent or semi-transparent output is a foothold for chain analysis, and it fragments the anonymity set. The project's direction is to converge on RingCT as the single transaction type." },
      { type: "note", text: "Status check, and this matters: the RingCT-only migration is in progress, not finished. Automatic conversion of legacy basecoin and CT outputs to RingCT is proposed in PR #1055 and RingCT staking in PR #1019. Neither is merged, and neither is in the current release (v1.4.2.0). There is no auto-convert setting to enable in your wallet today. Anyone telling you otherwise is describing an unreleased branch." },
      { type: "h", text: "What you can actually do today" },
      { type: "ul", items: [
        "Receive on your stealth address (sv…), not a basecoin address",
        "Move balances into RingCT yourself using the wallet's send-type commands",
        "Keep the mints you intend to stake as Zerocoin mints — see Lesson 7",
        "Follow the two PRs above if you want to track the migration"
      ]}
    ],
    sources: [
      { label: "PR #1055 — Auto-convert basecoin and CT to RingCT (open)", url: "https://github.com/Veil-Project/veil/pull/1055" },
      { label: "PR #1019 — Implement RingCT Staking (open)", url: "https://github.com/Veil-Project/veil/pull/1019" }
    ],
    quiz: [
      {
        prompt: "Why do multiple coexisting coin types weaken privacy?",
        options: { a: "They increase fees", b: "They fragment the anonymity set and give chain analysis a foothold", c: "They slow down syncing" }
      },
      {
        prompt: "Which address type should you give out to receive Veil?",
        options: { a: "Basecoin address (bv…)", b: "Stealth address (sv…)", c: "Any address type is equally private" }
      },
      {
        prompt: "Is automatic basecoin/CT to RingCT conversion available in the current wallet?",
        options: { a: "Yes, enable it in Settings", b: "No — it is an open PR (#1055), not yet released", c: "Yes, it is on by default" }
      },
      {
        prompt: "What is the difference between RingCT and a Zerocoin mint?",
        options: { a: "They are two names for the same thing", b: "RingCT is the private transaction type; Zerocoin mints are the fixed-denomination outputs that stake", c: "Zerocoin is the old name for RingCT" }
      },
      {
        prompt: "Why does a stealth address protect you better than a reused basecoin address?",
        options: { a: "It is encrypted with a longer key", b: "Each payment lands on a fresh one-time output, so payers cannot link them", c: "It has lower fees" }
      }
    ]
  },
  {
    id: 7,
    title: "Minting for Staking",
    summary: "How basecoin becomes Zerocoin mints, and why it mostly happens on its own.",
    xp: 75,
    body: [
      { type: "p", text: "To stake, your balance has to be in Zerocoin mints. Minting is the process that converts basecoin into those fixed-denomination outputs." },
      { type: "h", text: "The wallet does this for you" },
      { type: "p", text: "Veil ships with automatic minting turned on. Left alone, a synced wallet will convert eligible basecoin into Zerocoin mints on its own — for most people there is no manual step at all." },
      { type: "note", text: "There is no Privacy tab in the Veil GUI. If a guide tells you to click one, it is out of date. Minting is automatic by default, and manual minting is done from the debug console." },
      { type: "h", text: "Controlling it" },
      { type: "ul", items: [
        "-automintoff — start the wallet with automatic minting disabled",
        "-nautomintdenom=<n> — set the denomination automint prefers",
        "mintzerocoin <amount> — mint manually from the debug console"
      ]},
      { type: "code", text: "mintzerocoin 100" },
      { type: "h", text: "Maturity" },
      { type: "p", text: "A new mint cannot stake immediately. It needs 1000 confirmations before the staking engine will consider it. At roughly one block per minute that is somewhere around 16 to 17 hours. Until then the mint shows in your balance but contributes no staking weight." },
      { type: "h", text: "Going back the other way" },
      { type: "p", text: "Minting is not a trapdoor. The spendzerocoin command converts mints back into spendable output, and of course spending a mint in a normal transaction also consumes it. What you cannot do is silently un-mint in place — reversing it is a transaction on the chain like any other." }
    ],
    sources: [
      { label: "rpczerocoin.cpp — mintzerocoin / spendzerocoin", url: "https://github.com/Veil-Project/veil/blob/master/src/wallet/rpczerocoin.cpp" },
      { label: "wallet/init.cpp — -automintoff and -nautomintdenom", url: "https://github.com/Veil-Project/veil/blob/master/src/wallet/init.cpp" }
    ],
    quiz: [
      {
        prompt: "How many confirmations must a mint reach before it can stake?",
        options: { a: "200", b: "500", c: "1000" }
      },
      {
        prompt: "How does minting normally happen in the Veil wallet?",
        options: { a: "Automatically — automint is on by default", b: "Manually, from the Privacy tab", c: "It must be requested from a mining pool" }
      },
      {
        prompt: "Which startup flag disables automatic minting?",
        options: { a: "-disablemint", b: "-automintoff", c: "-nomint" }
      },
      {
        prompt: "Which console command mints manually?",
        options: { a: "mintzerocoin", b: "createmint", c: "stakemint" }
      },
      {
        prompt: "Can a mint be converted back to spendable output?",
        options: { a: "No, minting is permanent", b: "Yes, with spendzerocoin", c: "Only after the mint has won a block" }
      }
    ]
  },
  {
    id: 8,
    title: "Denominations & Efficiency",
    summary: "The four Zerocoin denominations and how your mix affects fees and privacy.",
    xp: 75,
    body: [
      { type: "p", text: "Zerocoin mints exist only in fixed sizes. There are exactly four denominations on Veil:" },
      { type: "ul", items: [
        "10 VEIL",
        "100 VEIL",
        "1,000 VEIL",
        "10,000 VEIL"
      ]},
      { type: "note", text: "Fixed denominations are a privacy feature, not a limitation. If mints could be any size, the exact amount would fingerprint the transaction. Forcing everything into four buckets means one 100 VEIL mint looks identical to every other 100 VEIL mint on the chain." },
      { type: "h", text: "Choosing a mix" },
      { type: "p", text: "Larger denominations mean fewer mints for the same value: smaller transactions, lower fees when you spend, and less data on the chain. The tradeoff is granularity — if all you hold is a 10,000 VEIL mint and you want to send 50, you have to break it, which generates change." },
      { type: "p", text: "Staking rewards arrive as 10 VEIL mints, so a wallet that has been staking for a while accumulates a lot of small mints. Consolidating them periodically keeps your transactions lean." },
      { type: "h", text: "Denomination and staking weight" },
      { type: "p", text: "For staking, the denomination itself is not what matters — total mature minted value is. Ten 100 VEIL mints and one 1,000 VEIL mint carry the same weight." }
    ],
    sources: [
      { label: "libzerocoin/Denominations.h — the four denominations", url: "https://github.com/Veil-Project/veil/blob/master/src/libzerocoin/Denominations.h" }
    ],
    quiz: [
      {
        prompt: "What is the largest Zerocoin denomination?",
        options: { a: "1,000 VEIL", b: "10,000 VEIL", c: "100,000 VEIL" }
      },
      {
        prompt: "What is the smallest Zerocoin denomination?",
        options: { a: "1 VEIL", b: "5 VEIL", c: "10 VEIL" }
      },
      {
        prompt: "Why are denominations fixed rather than arbitrary?",
        options: { a: "To keep the code simpler", b: "So mints of the same size are indistinguishable from each other", c: "To limit the total supply" }
      },
      {
        prompt: "Why are larger denominations generally more efficient?",
        options: { a: "They earn more staking rewards", b: "Fewer mints for the same value means smaller transactions and lower fees", c: "They mature faster" }
      },
      {
        prompt: "For staking weight, which matters?",
        options: { a: "Individual denomination size", b: "Total mature minted value", c: "The number of separate mints" }
      }
    ]
  },
  {
    id: 9,
    title: "Mining Algorithms",
    summary: "ProgPoW, RandomX, and SHA-256d — hardware, software, and solo vs pool.",
    xp: 75,
    body: [
      { type: "p", text: "Veil runs three Proof-of-Work algorithms at the same time, each with its own difficulty adjustment. They target deliberately different hardware so that no single type of machine controls block production." },
      { type: "h", text: "ProgPoW — GPUs — about 35% of blocks" },
      { type: "p", text: "Programmatic Proof-of-Work is designed to use the full range of a consumer GPU's capabilities, which makes purpose-built ASICs far less advantageous than they are for simpler algorithms. Both Nvidia and AMD cards work. Miners in use include T-Rex, WildRig, TT-Miner, and veilminer." },
      { type: "h", text: "RandomX — CPUs — about 10% of blocks" },
      { type: "p", text: "RandomX executes randomly generated programs and is deliberately memory-hard, which suits general-purpose CPUs and frustrates specialised hardware. Cache size matters a great deal, so CPUs with large L3 caches — AMD Ryzen and EPYC in particular — have a real advantage. The standard miner is XMRig." },
      { type: "h", text: "SHA-256d — ASICs — about 5% of blocks" },
      { type: "p", text: "Veil's SHA-256d is standard double-SHA256, the same hash function Bitcoin uses. SHA-256 ASICs can and do mine Veil — that is exactly who this 5% share is intended for." },
      { type: "note", text: "What differs from Bitcoin is the block header layout, not the hash function. Because the header Veil hashes is serialised differently, mining software cannot point straight at a Veil node the way it would at a Bitcoin node — it needs a pool or a stratum proxy that formats the work correctly. The hashing hardware itself is completely standard." },
      { type: "h", text: "Solo vs pool" },
      { type: "p", text: "Solo mining pays the full block reward to your own address with no pool cut, but the variance is brutal — with 5% of blocks split among all SHA-256d miners, a small solo operation can go a very long time between blocks. Pools smooth this into steady smaller payments in exchange for a fee." },
      { type: "p", text: "To solo mine you need either TT-Miner, which can talk to a Veil node directly, or a stratum proxy sitting between your miner and your node. Your node needs server=1 and a miningaddress set to a basecoin address, which you can generate with getnewbasecoinaddress in the debug console." },
      { type: "p", text: "Check veil-stats.com for currently active pools across all three algorithms." }
    ],
    sources: [
      { label: "primitives/block.cpp — GetSha256DPoWHash", url: "https://github.com/Veil-Project/veil/blob/master/src/primitives/block.cpp" },
      { label: "veil-node-stratum-proxy", url: "https://github.com/us77ipis/veil-node-stratum-proxy" }
    ],
    quiz: [
      {
        prompt: "Which algorithm targets GPUs and resists ASIC specialisation?",
        options: { a: "RandomX", b: "SHA-256d", c: "ProgPoW" }
      },
      {
        prompt: "What share of daily blocks does RandomX target?",
        options: { a: "5%", b: "10%", c: "35%" }
      },
      {
        prompt: "Which CPU line has an advantage in RandomX, and why?",
        options: { a: "Intel, for higher clock speeds", b: "AMD Ryzen and EPYC, for large L3 cache", c: "Qualcomm, for power efficiency" }
      },
      {
        prompt: "Can SHA-256 ASICs mine Veil?",
        options: { a: "Yes — Veil's SHA-256d is standard double-SHA256", b: "No, Veil uses a modified hash function", c: "Only ASICs made specifically for Veil" }
      },
      {
        prompt: "Why can't mining software point directly at a Veil node for SHA-256d?",
        options: { a: "The hash function is different", b: "The block header is serialised differently, so it needs a pool or stratum proxy", c: "Veil nodes do not accept mining connections" }
      }
    ]
  },
  {
    id: 10,
    title: "Inside the Staking Engine",
    summary: "How Veil picks a winning mint, and what actually happens when you win a block.",
    xp: 100,
    body: [
      { type: "p", text: "Understanding what the staking engine does with your mints makes it much clearer why the setup advice in Lesson 4 is what it is." },
      { type: "h", text: "The stake hash" },
      { type: "p", text: "For each mature mint, the wallet builds a hash from four values: the stake modifier, the timestamp of the previous block, a unique identifier derived from the mint, and the current transaction time. If the resulting hash falls below the target, that mint wins the block." },
      { type: "p", text: "The stake modifier is not something you can influence — for Zerocoin stakes it comes from the accumulator hash for that denomination, so it changes as the chain moves forward. Only the transaction time varies as the wallet searches, which is why staking is a slow, low-power scan rather than a hashrate race." },
      { type: "note", text: "This is the key difference from mining: throwing more CPU at staking gains you nothing. The target is scaled by the value of the mint being tested, so weight comes from coins, not compute. A staking wallet on a Raspberry Pi competes just as well as one on a workstation." },
      { type: "h", text: "What happens when you win" },
      { type: "ul", items: [
        "The winning mint is spent",
        "A brand new mint of the same denomination is created and returned to you, so your staked value is preserved",
        "The block reward is paid to you as one or more new 10 VEIL mints",
        "All of these are fresh mints, so they start at zero confirmations and must mature again"
      ]},
      { type: "p", text: "That last point explains a common surprise: your balance goes up right away, but the newly created mints cannot stake until they too reach 1000 confirmations." },
      { type: "h", text: "Practical consequences" },
      { type: "ul", items: [
        "Keep the wallet running — a wallet that is offline is not scanning, and blocks it would have won go to someone else",
        "Keep it unlocked for staking only, so an intruder cannot spend the mints",
        "Expect to accumulate many 10 VEIL mints over time, and consolidate occasionally",
        "Uptime matters far more than hardware"
      ]}
    ],
    sources: [
      { label: "proofofstake/kernel.cpp — CheckStake", url: "https://github.com/Veil-Project/veil/blob/master/src/veil/proofofstake/kernel.cpp" },
      { label: "proofofstake/stakeinput.cpp — ZerocoinStake::CreateTxOuts", url: "https://github.com/Veil-Project/veil/blob/master/src/veil/proofofstake/stakeinput.cpp" }
    ],
    quiz: [
      {
        prompt: "Which values are combined into the stake hash?",
        options: { a: "Your address, balance, and a timestamp", b: "The stake modifier, previous block time, mint identifier, and transaction time", c: "Your IP, wallet ID, and block height" }
      },
      {
        prompt: "Does a faster CPU improve your staking odds?",
        options: { a: "Yes, it tests more hashes per second", b: "No — the target is scaled by mint value, so weight comes from coins", c: "Only for mints above 1,000 VEIL" }
      },
      {
        prompt: "What happens to the mint that wins a block?",
        options: { a: "It is destroyed", b: "It is locked for 24 hours", c: "It is spent and an identical new mint is returned to you" }
      },
      {
        prompt: "In what form is the staking reward paid?",
        options: { a: "As new 10 VEIL mints", b: "As transparent basecoin", c: "As a RingCT output" }
      },
      {
        prompt: "Why must you keep the wallet online to stake?",
        options: { a: "To receive software updates", b: "An offline wallet is not scanning, so it cannot win blocks", c: "To keep your mints from expiring" }
      }
    ]
  },
  {
    id: 11,
    title: "How to Contribute",
    summary: "Code, testing, docs, community, and running a node.",
    xp: 100,
    body: [
      { type: "p", text: "Veil is open source and community-run. There is useful work here for you whether or not you write code." },
      { type: "h", text: "Testing — the most valuable thing most people can do" },
      { type: "p", text: "Privacy code is unusually hard to review by reading alone, and consensus bugs are expensive. Running release candidates, testing open PRs before they merge, and reporting what breaks with clear reproduction steps is genuinely the highest-leverage contribution available to a non-developer." },
      { type: "h", text: "Code" },
      { type: "p", text: "The core wallet is C++, derived from Bitcoin Core. Fork Veil-Project/veil, work on a branch, and open a pull request. Issues tagged 'help wanted' are a reasonable place to start, and CONTRIBUTING.md covers the conventions." },
      { type: "h", text: "Documentation and education" },
      { type: "p", text: "Write guides, fix outdated ones, make videos, or add lessons to this site. A surprising amount of Veil documentation on the internet describes wallet versions from years ago — correcting that is real work with real value." },
      { type: "h", text: "Community" },
      { type: "p", text: "Answer questions in Discord and Telegram, and help new users who are stuck on sync or staking setup." },
      { type: "h", text: "Run a full node" },
      { type: "p", text: "Every additional full node independently validates the chain and serves blocks to peers. Forward port 58810 for mainnet so other nodes can connect inbound; a node that only makes outbound connections still validates for you but contributes much less to the network." }
    ],
    quiz: [
      {
        prompt: "What language is the Veil core wallet written in?",
        options: { a: "Rust", b: "Go", c: "C++" }
      },
      {
        prompt: "Which port should be forwarded for a Veil mainnet node?",
        options: { a: "8333", b: "58810", c: "18333" }
      },
      {
        prompt: "Where do you report bugs and find 'help wanted' tasks?",
        options: { a: "The Veil Discord only", b: "GitHub Issues", c: "The wallet debug console" }
      },
      {
        prompt: "Why is testing described as the highest-leverage non-code contribution?",
        options: { a: "It is the easiest task available", b: "Privacy and consensus bugs are hard to catch by reading code and expensive to ship", c: "Testers are paid per bug" }
      },
      {
        prompt: "Why forward the P2P port on a full node?",
        options: { a: "It syncs faster", b: "So other nodes can connect inbound, which is what helps the network", c: "It is required to stake" }
      }
    ]
  }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Total XP available across all lessons */
function totalXP() {
  return LESSONS.reduce((sum, l) => sum + l.xp, 0);
}

/** Returns a lesson by id, or null */
function getLessonById(id) {
  return LESSONS.find(l => l.id === id) || null;
}

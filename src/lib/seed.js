import { getDb, getFs } from './firebase';
import { IPL_PLAYERS } from '../data/players';

// This script can be run from the console or a temporary component to seed Firestore
export const seedPlayers = async () => {
  try {
    const { collection, doc, setDoc } = await getFs();
    const db = await getDb();
    const playersRef = collection(db, 'players');
    for (const player of IPL_PLAYERS) {
      await setDoc(doc(playersRef, player.id), player);
    }
    // Players seeded successfully!
  } catch (error) {
    // Error seeding players
  }
};

export const createInitialAuction = async (auctionId) => {
  try {
    const { doc, setDoc } = await getFs();
    const db = await getDb();
    await setDoc(doc(db, 'auctions', auctionId), {
      name: "Mega Auction",
      status: "active",
      hostId: "system",
      currentAuction: {
        playerId: "p1",
        currentBid: 2.0,
        highBidderId: null,
        highBidderName: "Base Price",
        timerEndsAt: Date.now() + 60000,
        status: "bidding"
      }
    });
    // Initial auction created!
  } catch (error) {
    // Error creating initial auction
  }
};

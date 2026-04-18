import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export interface UserProfile {
  uid: string;
  displayName?: string;
  username?: string;
  photoURL?: string;
  bio?: string;
  lastNI?: number;
  isPrivate?: boolean;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: any;
  updatedAt: any;
  // Joined data
  senderProfile?: UserProfile;
  receiverProfile?: UserProfile;
}

// Search users by username or email
export async function searchUsers(searchQuery: string): Promise<UserProfile[]> {
  if (!searchQuery || searchQuery.length < 3) return [];
  
  const usersRef = collection(db, "users");
  
  // Normalize search query for username (add @ if missing and convert to lowercase)
  const queryLower = searchQuery.toLowerCase();
  const normalizedUsername = queryLower.startsWith('@') ? queryLower : `@${queryLower}`;
  
  // Search in username_lower (new field) and username (old field, for backward compatibility)
  const qUsernameLower = query(
    usersRef, 
    where("isPrivate", "==", false),
    where("username_lower", ">=", normalizedUsername),
    where("username_lower", "<=", normalizedUsername + '\uf8ff')
  );
  
  const qUsernameOriginal = query(
    usersRef, 
    where("isPrivate", "==", false),
    where("username", ">=", normalizedUsername),
    where("username", "<=", normalizedUsername + '\uf8ff')
  );

  const qEmail = query(
    usersRef, 
    where("isPrivate", "==", false),
    where("email", ">=", queryLower),
    where("email", "<=", queryLower + '\uf8ff')
  );
  
  const [lowerSnap, originalSnap, emailSnap] = await Promise.all([
    getDocs(qUsernameLower),
    getDocs(qUsernameOriginal),
    getDocs(qEmail)
  ]);
  
  const results = new Map<string, UserProfile>();
  
  [lowerSnap, originalSnap, emailSnap].forEach(snap => {
    snap.forEach(doc => {
      const data = doc.data();
      if (!data.isPrivate) {
        results.set(doc.id, { uid: doc.id, ...data } as UserProfile);
      }
    });
  });
  
  return Array.from(results.values());
}

export async function sendFriendRequest(senderId: string, receiverId: string) {
  if (senderId === receiverId) throw new Error("Cannot send request to yourself");
  
  // Check if request already exists
  const requestsRef = collection(db, "friend_requests");
  const q1 = query(requestsRef, where("senderId", "==", senderId), where("receiverId", "==", receiverId));
  const q2 = query(requestsRef, where("senderId", "==", receiverId), where("receiverId", "==", senderId));
  
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  if (!snap1.empty || !snap2.empty) {
    throw new Error("Friend request already exists or you are already friends");
  }
  
  const newRequestRef = doc(requestsRef);
  await setDoc(newRequestRef, {
    senderId,
    receiverId,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function acceptFriendRequest(requestId: string, senderId: string, receiverId: string) {
  // Update request status
  const requestRef = doc(db, "friend_requests", requestId);
  await setDoc(requestRef, {
    status: "accepted",
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  // Add to each other's friends subcollection
  const senderFriendRef = doc(db, "users", senderId, "friends", receiverId);
  const receiverFriendRef = doc(db, "users", receiverId, "friends", senderId);
  
  await Promise.all([
    setDoc(senderFriendRef, { uid: receiverId, createdAt: serverTimestamp() }),
    setDoc(receiverFriendRef, { uid: senderId, createdAt: serverTimestamp() })
  ]);
}

export async function rejectFriendRequest(requestId: string) {
  const requestRef = doc(db, "friend_requests", requestId);
  await setDoc(requestRef, {
    status: "rejected",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function removeFriend(currentUserId: string, friendId: string) {
  // Remove from friends subcollections
  const myFriendRef = doc(db, "users", currentUserId, "friends", friendId);
  const theirFriendRef = doc(db, "users", friendId, "friends", currentUserId);
  
  await Promise.all([
    deleteDoc(myFriendRef),
    deleteDoc(theirFriendRef)
  ]);
  
  // Also delete the friend request to allow adding again in the future
  const requestsRef = collection(db, "friend_requests");
  const q1 = query(requestsRef, where("senderId", "==", currentUserId), where("receiverId", "==", friendId));
  const q2 = query(requestsRef, where("senderId", "==", friendId), where("receiverId", "==", currentUserId));
  
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  const deletePromises: Promise<void>[] = [];
  snap1.forEach(d => deletePromises.push(deleteDoc(d.ref)));
  snap2.forEach(d => deletePromises.push(deleteDoc(d.ref)));
  
  await Promise.all(deletePromises);
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { uid: snap.id, ...snap.data() } as UserProfile;
  }
  return null;
}

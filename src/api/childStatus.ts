import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {auth, db} from './config';

// Define interfaces for child status data types
export interface Child {
  id: string;
  name: string;
  birthDate?: Date | null;
  allergies?: string[];
  specialNeeds?: string;
  [key: string]: any;
}

export interface ChildStatus {
  id: string;
  childId: string;
  childName?: string;
  mood?: string;
  health?: string;
  activities?: string[];
  mealStatus?: string;
  notes?: string;
  kindergartenId?: string;
  createdBy?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  updatedBy?: string;
  child?: Child;
  [key: string]: any;
}

export interface ChildStatusUpdate {
  childId: string;
  mood?: string;
  health?: string;
  activities?: string[];
  mealStatus?: string;
  notes?: string;
  [key: string]: any;
}

// Get child statuses based on user type
export async function getChildStatuses(): Promise<ChildStatus[]> {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get user data to determine type
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    let childStatusDocs: ChildStatus[] = [];

    // Different query based on user type
    if (userData.userType === 'parent') {
      // Get children where this user is the parent
      const childrenRef = collection(db, 'children');
      const childrenQuery = query(
        childrenRef,
        where('parentId', '==', user.uid),
      );
      const childrenSnapshot = await getDocs(childrenQuery);

      // Get status for each child
      const childPromises = childrenSnapshot.docs.map(async childDoc => {
        const childData = childDoc.data();
        const statusRef = collection(db, 'childStatuses');
        const statusQuery = query(
          statusRef,
          where('childId', '==', childDoc.id),
          orderBy('createdAt', 'desc'),
        );
        const statusSnapshot = await getDocs(statusQuery);

        return statusSnapshot.docs.map(statusDoc => {
          const statusData = statusDoc.data();
          return {
            id: statusDoc.id,
            childId: childDoc.id,
            childName: childData.firstName + ' ' + childData.lastName,
            ...statusData,
            createdAt: statusData.createdAt?.toDate?.() || null,
            updatedAt: statusData.updatedAt?.toDate?.() || null,
          };
        });
      });

      const childStatusArrays = await Promise.all(childPromises);
      childStatusDocs = childStatusArrays.flat();
    } else if (userData.userType === 'kindergarten') {
      // Get child statuses for this kindergarten
      const statusRef = collection(db, 'childStatuses');
      const statusQuery = query(
        statusRef,
        where('kindergartenId', '==', userData.kindergartenId || user.uid),
        orderBy('createdAt', 'desc'),
      );
      const statusSnapshot = await getDocs(statusQuery);

      // Get child data for each status
      const statusPromises = statusSnapshot.docs.map(async statusDoc => {
        const statusData = statusDoc.data();
        const childRef = doc(db, 'children', statusData.childId);
        const childDoc = await getDoc(childRef);

        let childName = 'Unknown Child';
        if (childDoc.exists()) {
          const childData = childDoc.data();
          childName = childData.firstName + ' ' + childData.lastName;
        }

        return {
          id: statusDoc.id,
          childId: statusData.childId,
          childName,
          ...statusData,
          createdAt: statusData.createdAt?.toDate?.() || null,
          updatedAt: statusData.updatedAt?.toDate?.() || null,
        };
      });

      childStatusDocs = await Promise.all(statusPromises);
    }

    return childStatusDocs;
  } catch (error) {
    console.error('Error getting child statuses:', error);
    throw error;
  }
}

// Get a single child status by ID
export async function getChildStatusById(id: string): Promise<ChildStatus> {
  try {
    const statusRef = doc(db, 'childStatuses', id);
    const statusDoc = await getDoc(statusRef);

    if (!statusDoc.exists()) {
      throw new Error('Child status not found');
    }

    const statusData = statusDoc.data();

    // Get child details
    const childRef = doc(db, 'children', statusData.childId);
    const childDoc = await getDoc(childRef);

    let child: Child = {id: statusData.childId, name: 'Unknown Child'};

    if (childDoc.exists()) {
      const childData = childDoc.data();
      child = {
        id: childDoc.id,
        name: childData.firstName + ' ' + childData.lastName,
        birthDate: childData.birthDate?.toDate?.() || null,
        allergies: childData.allergies || [],
        specialNeeds: childData.specialNeeds || '',
      };
    }

    return {
      id: statusDoc.id,
      ...statusData,
      createdAt: statusData.createdAt?.toDate?.() || null,
      updatedAt: statusData.updatedAt?.toDate?.() || null,
      child,
    } as ChildStatus;
  } catch (error) {
    console.error('Error getting child status:', error);
    throw error;
  }
}

// Create a new child status
export async function createChildStatus(
  statusData: ChildStatusUpdate,
): Promise<ChildStatus> {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get user data
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Only kindergarten staff can create status updates
    if (userData.userType !== 'kindergarten') {
      throw new Error('Only kindergarten staff can create status updates');
    }

    // Set timestamps and user information
    const newStatus = {
      ...statusData,
      kindergartenId: userData.kindergartenId || user.uid,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await addDoc(collection(db, 'childStatuses'), newStatus);

    return {
      id: docRef.id,
      ...newStatus,
      createdAt: new Date(), // Use current date since serverTimestamp() is not a Date object
      updatedAt: new Date(),
    } as ChildStatus;
  } catch (error) {
    console.error('Error creating child status:', error);
    throw error;
  }
}

// Update an existing child status
export async function updateChildStatus(
  id: string,
  statusData: ChildStatusUpdate,
): Promise<ChildStatus> {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get the status document
    const statusRef = doc(db, 'childStatuses', id);
    const statusDoc = await getDoc(statusRef);

    if (!statusDoc.exists()) {
      throw new Error('Child status not found');
    }

    const currentStatus = statusDoc.data();

    // Get user data
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();

    // Only the creator or other staff from the same kindergarten can update
    if (
      userData.userType !== 'kindergarten' ||
      (currentStatus.kindergartenId !== userData.kindergartenId &&
        currentStatus.kindergartenId !== user.uid)
    ) {
      throw new Error('You do not have permission to update this status');
    }

    // Update the document
    const updateData = {
      ...statusData,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    };

    await updateDoc(statusRef, updateData);

    return {
      id,
      ...currentStatus,
      ...updateData,
      createdAt: currentStatus.createdAt?.toDate?.() || null,
      updatedAt: new Date(), // Use current date for the response
    } as ChildStatus;
  } catch (error) {
    console.error('Error updating child status:', error);
    throw error;
  }
}

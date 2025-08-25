// api/wasteApi.js
import database from '@react-native-firebase/database';

// Add waste items to Firebase (run this once to populate data)
// export const addWasteItemsToFirebase = async () => {
//   const wasteItems = {
//     electronic: {
//       title_ar: 'النفايات الإلكترونية',
//       title_en: 'Electronic Waste',
//       description_ar: 'البطاريات، الهواتف، أجهزة الكمبيوتر',
//       description_en: 'Batteries, phones, computers',
//       phone: '+961 6 123 456',
//       icon: '🔋',
//       order: 1,
//       active: true
//     },
//     medical: {
//       title_ar: 'النفايات الطبية',
//       title_en: 'Medical Waste',
//       description_ar: 'الحقن، الأدوية',
//       description_en: 'Syringes, medications',
//       phone: '+961 6 789 012',
//       icon: '🏥',
//       order: 2,
//       active: true
//     },
//     construction: {
//       title_ar: 'نفايات البناء',
//       title_en: 'Construction Waste',
//       description_ar: 'الخرسانة، المعادن، الخشب',
//       description_en: 'Concrete, metal, wood',
//       phone: '+961 6 345 678',
//       icon: '🏗️',
//       order: 3,
//       active: true
//     },
//     chemical: {
//       title_ar: 'النفايات الكيميائية',
//       title_en: 'Chemical Waste',
//       description_ar: 'الطلاء، المذيبات، الزيوت',
//       description_en: 'Paint, solvents, oils',
//       phone: '+961 6 901 234',
//       icon: '🧪',
//       order: 4,
//       active: true
//     },
//     organic: {
//       title_ar: 'النفايات العضوية',
//       title_en: 'Organic Waste',
//       description_ar: 'بقايا الطعام، النباتات',
//       description_en: 'Food waste, plants',
//       phone: '+961 6 567 890',
//       icon: '🌱',
//       order: 5,
//       active: true
//     },
//     hazardous: {
//       title_ar: 'النفايات الخطرة',
//       title_en: 'Hazardous Waste',
//       description_ar: 'المواد السامة، المواد المشعة',
//       description_en: 'Toxic materials, radioactive materials',
//       phone: '+961 6 234 567',
//       icon: '☢️',
//       order: 6,
//       active: true
//     }
//   };

//   try {
//     await database().ref('/waste_items').set(wasteItems);
//     console.log('تم إضافة عناصر النفايات بنجاح');
//   } catch (error) {
//     console.error('خطأ في إضافة عناصر النفايات:', error);
//   }
// };

// Fetch waste items from Firebase
export const fetchWasteItems = async () => {
  try {
    const snapshot = await database().ref('/waste_items').once('value');
    const wasteData = snapshot.val();
    
    if (!wasteData) {
      return [];
    }

    // Convert to array and sort by order
    const wasteArray = Object.keys(wasteData)
      .map(key => ({
        id: key,
        ...wasteData[key]
      }))
      .filter(item => item.active) // Only show active items
      .sort((a, b) => a.order - b.order);

    return wasteArray;
  } catch (error) {
    console.error('خطأ في جلب عناصر النفايات:', error);
    throw error;
  }
};

// Update a waste item
export const updateWasteItem = async (itemId, updates) => {
  try {
    await database().ref(`/waste_items/${itemId}`).update(updates);
    console.log('تم تحديث العنصر بنجاح');
  } catch (error) {
    console.error('خطأ في تحديث العنصر:', error);
    throw error;
  }
};

// Add a new waste item
export const addWasteItem = async (newItem) => {
  try {
    const newRef = await database().ref('/waste_items').push(newItem);
    console.log('تم إضافة عنصر جديد بنجاح');
    return newRef.key;
  } catch (error) {
    console.error('خطأ في إضافة عنصر جديد:', error);
    throw error;
  }
};

// Delete a waste item (soft delete by setting active to false)
export const deleteWasteItem = async (itemId) => {
  try {
    await database().ref(`/waste_items/${itemId}`).delete();
    console.log('تم حذف العنصر بنجاح');
  } catch (error) {
    console.error('خطأ في حذف العنصر:', error);
    throw error;
  }
};
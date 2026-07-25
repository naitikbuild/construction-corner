import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createChat, sendMessage } from './chatService';
import { sendNotification } from './notificationService';

function formatEnquiryMessage({ typesOfWork, area, sqft, timeline, clientName, clientPhone }) {
  const lines = [
    '📋 New Enquiry',
    `Work: ${typesOfWork.join(', ')}`,
    area ? `Area: ${area}` : null,
    sqft ? `Size: ${sqft} sq ft` : null,
    timeline ? `Timeline: ${timeline}` : null,
    `Contact: ${clientName} — ${clientPhone}`,
  ].filter(Boolean);
  return lines.join('\n');
}

// Creates/reuses the chat with the provider, posts the enquiry as the first
// message, records it in the `enquiries` collection, and notifies the
// provider. Returns { chatId, enquiryId } on success.
export const submitEnquiry = async (enquiry) => {
  const {
    clientId, clientName, clientPhone,
    providerId, providerName, profileType,
    typesOfWork, area, sqft, timeline,
  } = enquiry;

  const chatId = await createChat(
    { uid: clientId, name: clientName },
    { uid: providerId, name: providerName }
  );

  const messageText = formatEnquiryMessage({ typesOfWork, area, sqft, timeline, clientName, clientPhone });
  await sendMessage(chatId, messageText, clientId);

  const ref = await addDoc(collection(db, 'enquiries'), {
    clientId,
    clientName,
    clientPhone,
    providerId,
    providerName,
    profileType: profileType || '',
    typesOfWork,
    area: area || '',
    sqft: sqft || '',
    timeline,
    chatId,
    status: 'new',
    createdAt: serverTimestamp(),
  });

  await sendNotification(providerId, 'enquiry', `New enquiry received from ${clientName}`, {
    chatId,
    enquiryId: ref.id,
  });

  return { chatId, enquiryId: ref.id };
};


export interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  profilePicture?: string;
}

export enum Tab {
  Ask = 'Ask',
  Live = 'Live',
  Vision = 'Vision',
  Settings = 'Settings',
}

export interface SurveyAnswers {
  introductionSource: string;
  usedBefore: string;
  isVisuallyImpaired: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}
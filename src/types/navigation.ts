export type ChildStatusStackParamList = {
  ChildStatusList: undefined;
  ChildStatusDetail: {
    statusId: string;
    childName?: string;
  };
};

export type BlogStackParamList = {
  BlogList: undefined;
  BlogDetail: {
    blogId: string;
    title?: string;
  };
};

export type RootStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  ChildStatus: undefined;
  Blog: undefined;
};

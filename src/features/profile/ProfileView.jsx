import { PROFILE_CONTENT } from './model/profileModel';
import ProfileScreen from './view/ProfileScreen';

function ProfileView() {
  return <ProfileScreen content={PROFILE_CONTENT} />;
}

export default ProfileView;

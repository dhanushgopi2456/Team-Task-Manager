import { getAvatarColor, getInitials } from '../../utils/helpers';

const Avatar = ({ name, size = 'md', className = '' }) => {
  const color = getAvatarColor(name);
  const initials = getInitials(name);
  return (
    <div className={`avatar avatar-${size} ${className}`} style={{ background: color }} title={name}>
      {initials}
    </div>
  );
};

export default Avatar;

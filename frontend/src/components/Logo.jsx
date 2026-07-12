import styles from './Logo.module.css';

/**
 * AssetFlow logo image used across sidebar, auth screens, and anywhere else.
 * `size` controls the width/height in pixels.
 */
export default function Logo({ size = 48 }) {
  return (
    <img
      src="/logo.jpg"
      alt="AssetFlow"
      className={styles.logo}
      style={{ width: size, height: size }}
    />
  );
}

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Input.module.css';

const Input = forwardRef(function Input(
  { label, error, type = 'text', id, appearance = 'default', ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className={`${styles.field} ${appearance === 'surface' ? styles.surfaceField : ''}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrap}>
        <input
          ref={ref}
          id={id}
          type={inputType}
          className={`${styles.input} ${appearance === 'surface' ? styles.surfaceInput : ''} ${error ? styles.error : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className={`${styles.toggle} ${appearance === 'surface' ? styles.surfaceToggle : ''}`}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
});

export default Input;

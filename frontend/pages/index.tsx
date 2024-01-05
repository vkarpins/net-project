import { FormEvent, useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { withSessionSsr } from '../lib/withSession';
import s from './login.module.css'
import Image from 'next/image'

interface LoginProps {
  userId: number;
}

export default function Login({ userId }: LoginProps) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      router.push({ pathname: '/mainPage' });
    }
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailRef.current || !passwordRef.current) return;

    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    try {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
      };
      const response = await fetch('/api/login', options);
      if (response.status !== 200) {
        throw new Error("Can't login");
      }
      router.push({ pathname: '/mainPage' });
    } catch (err) {
      console.error(err);
      setErrorMessage('Invalid login or password. Please try again.');
    }
  }
  return (
    <div className={s.loginContainer}>

      <div className={s.loginDescription}>Login</div>

      <form onSubmit={login}>

        <div className={s.loginFields}>
          <div>
            <input type='text' ref={emailRef} className={s.loginEmailField} placeholder='E-mail' />
            <Image
              priority
              src="/images/email_icon.svg"
              className={s.loginEmail}
              height={18}
              width={16}
              alt="icon"
            />
          </div>
          <div>
            <input type='password' ref={passwordRef} className={s.loginPasswordField} placeholder='Password' />
            <Image
              priority
              src="/images/password_icon.svg"
              className={s.loginPassword}
              height={18}
              width={16}
              alt="icon"
            />
          </div>
        </div>

        {errorMessage && (
          <div className={s.errorMessage}>
            {errorMessage}
          </div>
        )}

        <div className={s.loginSubmit}>
          <button type='submit' className={s.loginButtonContainer}>Login</button>
          <div className={s.loginRegisterButton}> <a href="/register">Don't have an account? Register</a> </div>
        </div>

      </form>
    </div>
  );
}

export const getServerSideProps = withSessionSsr(
  async function getServersideProps({ req }) {
    try {
      const userId = req.session.userId || '';

      return {
        props: {
          userId: userId,
        },
      };
    } catch (err) {
      console.log(err);

      return {
        redirect: {
          destination: '/login',
          statusCode: 307,
        },
      };
    }
  }
);

import { FormEvent, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withSessionSsr } from '../../lib/withSession';
import { useState } from 'react';
import s from './register.module.css';

interface RegisterProps {
  userId: number;
}

export default function Register({ userId }: RegisterProps) {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const userNameRef = useRef<HTMLInputElement>(null);
  const aboutRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const avatarDisplay=useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      router.push({ pathname: '/register' });
    }
  }, []);
  useEffect(() => {
    // Check if the error message is related to the email being taken
    // If it is not, update the error message only if it is currently null
    if (errorMessage && !errorMessage.includes('Email is taken')) {
      setErrorMessage((prevErrorMessage) => prevErrorMessage || 'Email is taken. Please try again.');
    }
  }, [errorMessage]);
  
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailRef.current || !passwordRef.current || !firstNameRef.current || !lastNameRef.current || !dateRef.current || !userNameRef.current || !aboutRef.current || !avatarRef.current) {
      return;
    }
  
    const email = emailRef.current.value;
  
    try {
   
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: passwordRef.current.value,
          firstName: firstNameRef.current.value,
          lastName: lastNameRef.current.value,
          dateOfBirth: dateRef.current.value,
          nickname: userNameRef.current.value,
          aboutMe: aboutRef.current.value,
          avatar: selectedFile,
        }),
      };
  
      const response = await fetch('/api/register', options);
  
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error(`Registration failed. Server response: ${response.status} - ${errorMessage}`);

        if (errorMessage.includes('Please enter a valid date with a four-digit year')) {
          setErrorMessage('Please enter a valid date with a four-digit year.');
        } else {
          setErrorMessage((prevErrorMessage) => prevErrorMessage || 'Email is taken. Please try again.');
        }
  
        return;
      }
  
      router.push({ pathname: '/' });
    } catch (err) {
      console.error(err);
      setErrorMessage('Registration failed. Please try again.');
    }
  }
  
  
  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        if (file.size > 1048576) {
            alert('File size should not exceed 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target && e.target.result) {
                setSelectedFile(e.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    }
};

  return (
    <div className={s.registerContainer}>

      <div className={s.registerDescription}>Register</div>

      <form onSubmit={register}>

        <div className={s.registerFields}>

          <div className={s.registerField1}>

            <input type='text' ref={emailRef} className={s.registerEmailField} placeholder='E-mail' required/>
            <input type='password' ref={passwordRef} className={s.registerPasswordField} placeholder='Password' required/>
            <input type='text' ref={firstNameRef} className={s.registerFNField} placeholder='First name' required/>
            <input type='text' ref={lastNameRef} className={s.registerLNField} placeholder='Last name' required/>
            <input type='date' ref={dateRef} id={s.registerDateField} placeholder='Date of birth' required
           onChange={(e) => {
            const inputDate = e.target.value;
            const [year, month, day] = inputDate.split('-');
            if (year.length !== 4) {
              setErrorMessage('Please enter a valid date with a four-digit year.');
            } else {
              const selectedDate = new Date(inputDate);
              const currentDate = new Date();
              if (selectedDate > currentDate) {
                setErrorMessage('Date of birth must be in the past and have a four-digit year.');
              } else {
                setErrorMessage(null);
              }
            }
            }}
            />

          </div>

          <div className={s.registerField2}>

            <input type='text' ref={userNameRef} className={s.registerUsernameField} placeholder='Username' />
            <input type="text" ref={aboutRef} className={s.registerAboutField} placeholder='About me' />

            <div className={s.registerAvatarFields}>

              <div id={s.registerAvatar} ref={avatarDisplay} placeholder='Avatar'>
                {selectedFile && (
                  <img src={selectedFile}/>
                )}
              </div>

              <input type="file" id={s.registerFile} ref={avatarRef} accept="image/*" onChange={handleFileChange} />

              {/* <button type="button"  onClick={() => avatarRef.current?.click()}></button> */}

            </div>

          </div>

        </div>
          {errorMessage && (
          <div className={s.errorMessage}>
            {errorMessage}
          </div>
      )}
        <div className={s.registerSubmit}>
          <button type='submit' className={s.registerButtonContainer}>Register now</button>
          <div className={s.registerLoginButton}> <a href="/">Already have an account? Login</a> </div>
        </div>

      </form>
    </div>
  );
}

export const getServerSideProps = withSessionSsr(
  async function getServersideProps({ req, res }) {
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
          destination: '/register',
          statusCode: 307,
        },
      };
    }
  }
);
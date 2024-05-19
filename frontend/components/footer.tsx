import React from 'react';
import s from './footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={s.footerWrap}>
    <div className={s.footerContainer}>
        <div className={s.aboutUs}>
            <p><b>About us:</b></p>
            <br></br>
            <p>Chapter believes that reading is a powerful tool for learning, growth and connection.</p>
            <p>Our mission is to create a vibrant online community for book lovers.</p>
        </div>
        <div className={s.rights}>
            <p>Created by passionate readers for passionate readers.</p>
            <br></br>
            <p>© 2024 Chapter.</p>
        </div>
        <div className={s.authors}>
            <p><b>Authors:</b></p>
            <br></br>
            <p>Chapter Team.</p>
        </div>
    </div>
</footer>
  );
};

export default Footer;
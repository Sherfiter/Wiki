import { useState } from 'react';

function Box({ title, logo, children }) {
  const inner = (
    <div>
      <span className="float-left text-4xl mr-3 mt-2">{logo}</span>
      <span className="font-serif text-lg border-b border-slate-600">
        <b>{title}</b>
      </span>
      <div className="font-serif pt-2">{children}</div>
    </div>
  );

  if (typeof logo === 'string') {
    if (logo.includes('⚠️')) return <div className="box red-box">{inner}</div>;
    if (logo.includes('⏰')) return <div className="box yellow-box">{inner}</div>;
    if (logo.includes('⚖️')) return <div className="box slate-box">{inner}</div>;
    if (logo.includes('💡') || logo.includes('💬'))
      return <div className="box purple-box">{inner}</div>;
  }
  return <div className="box blue-box">{inner}</div>;
}

function Quiz({ title, question, options, answer, comment }) {
  const [selected, setSelected] = useState(-1);
  const [answered, setAnswered] = useState(false);

  const submit = (i) => {
    setSelected(i);
    setAnswered(true);
  };

  const resultList = options.map((o, i) => {
    if (i === answer) return <li key={i} className="bg-green-300"> {o} </li>;
    if (i === selected) return <li key={i} className="bg-red-300"> {o} </li>;
    return <li key={i}> {o} </li>;
  });

  const choiceList = options.map((o, i) => (
    <li
      key={i}
      className="hover:cursor-pointer hover:bg-slate-200"
      onClick={() => submit(i)}
    >
      {o}
    </li>
  ));

  return (
    <Box logo="💡" title={title}>
      <div className="py-1">{question}</div>
      <ol className="quiz-card p-0 ml-8 my-1">{!answered ? choiceList : resultList}</ol>
      {answered && (
        <div className="pt-2 border-t border-slate-400 mt-2 text-purple-950">{comment}</div>
      )}
    </Box>
  );
}

function Profile({ avatar, name, links = [], children }) {
  return (
    <div className="profile-layout">
      <aside className="profile-sidebar">
        <img className="profile-avatar" src={avatar} alt={name} />
        <ul className="profile-links">
          {links.map((link) => (
            <li key={link.value}>
              <span className="profile-link-name">{link.name}</span>
              <a
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {link.value}
              </a>
            </li>
          ))}
        </ul>
      </aside>
      <div className="profile-body">{children}</div>
    </div>
  );
}

function Projects({ projects = [] }) {
  return (
    <ul className="project-list">
      {projects.map((p) => (
        <li key={p.name} className="project-card">
          <div className="project-head">
            <a href={p.url} target="_blank" rel="noopener noreferrer">
              {p.name}
            </a>
            {p.lang && <span className="project-lang">{p.lang}</span>}
          </div>
          {p.desc && <p className="project-desc">{p.desc}</p>}
        </li>
      ))}
    </ul>
  );
}

function Slideshow({ url }) {
  return (
    <div className="mx-20">
      <div className="text-center">
        <div className="slideshow w-full aspect-[4/3]">
          <iframe className="w-full h-full" src={url} />
        </div>
      </div>
    </div>
  );
}

export const mdxComponents = {
  Box,
  Quiz,
  Slideshow,
  Profile,
  Projects,
};

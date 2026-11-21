// About & credits (licences).
import { BRAND } from '../../content/brand';

export default function AboutPage() {
  return (
    <div className="about">
      <h1>About {BRAND.name}</h1>
      <section className="card">
        <p>{BRAND.name} is a free learning app that takes you from zero to confident chess player. It follows the official <strong>FIDE Laws of Chess</strong>, the rules of the World Championship. There is no account, no ads and no tracking. Your progress is saved only on your device.</p>
      </section>
      <section className="card">
        <h2>Credits &amp; licences</h2>
        <ul>
          <li><strong>chess.js</strong> by Jeff Hlywa: BSD-2-Clause licence. It checks legal moves.</li>
          <li><strong>React</strong>, <strong>React Router</strong> and <strong>Vite</strong>: MIT licence.</li>
          <li><strong>Pieces and Pip the pawn</strong>: original artwork made for this app. No third-party piece sets.</li>
          <li><strong>Sounds</strong>: generated live with the Web Audio API. No audio files.</li>
          <li><strong>Bots</strong>: our own engine (negamax with alpha-beta). It is not Stockfish, so no GPL code is included.</li>
          <li>Notation example game: &ldquo;The Opera Game&rdquo;, Morphy vs. Duke of Brunswick and Count Isouard, Paris 1858 (public domain).</li>
        </ul>
      </section>
      <section className="card">
        <h2>Learning with Pip</h2>
        <p>{BRAND.promise}</p>
        <p className="muted">Tip: to practice on a real site, start with games of 10 minutes or more, and take your time.</p>
      </section>
    </div>
  );
}

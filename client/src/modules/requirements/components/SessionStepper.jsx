// Parcours de séance (charte, principe UX n° 1) : situe l'étudiant dans les 5 étapes.
const STEPS = ['Scénario', 'Entretien', 'Cahier des charges', 'Changements', 'Évaluation'];

export default function SessionStepper({ current }) {
  const currentIndex = STEPS.indexOf(current);
  return (
    <ol className="stepper" aria-label="Parcours de la séance">
      {STEPS.map((step, index) => (
        <li
          key={step}
          className={`step${index < currentIndex ? ' is-done' : ''}${index === currentIndex ? ' is-current' : ''}`}
          aria-current={index === currentIndex ? 'step' : undefined}
        >
          {step}
        </li>
      ))}
    </ol>
  );
}

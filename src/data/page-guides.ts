export type PageGuideLink = { href: string; label: string };

export type PageGuide = {
  label: string;
  what: string;
  coverage: string;
  related?: PageGuideLink[];
  relatedGroups?: { label: string; links: PageGuideLink[] }[];
};

export const pageGuides: Record<string, PageGuide> = {
  home: {
    label: 'Research overview',
    what: 'A starting point for European staff rights and institutional accountability: court rulings, workplace rules and updates, selected official records, and parliamentary budget discharge.',
    coverage: 'Court and institutional feeds are checked on the configured daily schedule. Standing references, selected records and budget discharge are maintained by hand; none is a complete legal or policy record.',
    relatedGroups: [
      {
        label: 'Research',
        links: [
          { href: '/cases', label: 'Court rulings — search case law' },
          { href: '/rules', label: 'Rules & updates — policies and institution feeds' },
          { href: '/decisions', label: 'Selected records — editorial highlights' },
          { href: '/discharge', label: 'Budget discharge — votes and follow-up' }
        ]
      },
      {
        label: 'Site operations',
        links: [
          { href: '/monitoring', label: 'Monitoring' },
          { href: '/settings', label: 'AI settings' }
        ]
      }
    ]
  },
  cases: {
    label: 'Court records',
    what: 'Court of Justice and General Court records relevant to harassment, discrimination, psychosocial risk and related staff-rights questions, with official metadata and source links.',
    coverage: 'The collection comes from keyword searches of the official source and may miss relevant rulings; the archive can include Civil Service Tribunal records. Results default to newest judgment date, with filters and other sort options available.',
    related: [
      { href: '/rules', label: 'Rules & updates' },
      { href: '/decisions', label: 'Selected records' },
      { href: '/monitoring', label: 'Monitoring' }
    ]
  },
  case: {
    label: 'Individual case',
    what: 'The selected case’s official title, court metadata, matched topics and links to the publishing source, with retrieved-text status shown for each document.',
    coverage: 'The record reflects what the collection has imported. Generating an AI summary requires retrieved source text; any generated text is interpretation, not a court finding. The linked official document remains the authority.',
    related: [
      { href: '/cases', label: 'All court rulings' },
      { href: '/settings', label: 'AI settings' }
    ]
  },
  rules: {
    label: 'Institutional updates & references',
    what: 'Keyword-matched Ombudsman decisions and inquiries, Commission documents and Press Corner news, followed by standing staff rules and policy references maintained by hand.',
    coverage: 'The live groups are refreshed from source checks and are collapsed until opened. Standing references are editorially maintained, not daily imports, and the presence of a document does not make it a binding rule.',
    related: [
      { href: '/decisions', label: 'Selected records' },
      { href: '/discharge', label: 'Budget discharge' },
      { href: '/monitoring', label: 'Monitoring' }
    ]
  },
  decisions: {
    label: 'Editorial selection',
    what: 'A hand-curated selection of official court judgments, Ombudsman decisions and Commission reports on OLAF, each retaining its official title and source link; summaries are this site’s editorial descriptions.',
    coverage: 'This is an editorial selection, not a comprehensive daily feed. Records can overlap the Court rulings or Rules & updates collections and are ordered newest first when a date is available.',
    related: [
      { href: '/cases', label: 'Court rulings' },
      { href: '/rules', label: 'Rules & updates' },
      { href: '/discharge', label: 'Budget discharge' }
    ]
  },
  discharge: {
    label: 'Budget accountability',
    what: 'A hand-maintained guide to Parliament’s budgetary discharge decisions, institutional replies and follow-up documents, with links to Parliament, Commission and Court sources.',
    coverage: 'The page separates the budget year under review from the year a decision or follow-up document was published. It is editorial material and is not automatically updated by the monitoring worker.',
    related: [
      { href: '/decisions', label: 'Selected records' },
      { href: '/monitoring', label: 'Monitoring' }
    ]
  },
  monitoring: {
    label: 'Site operations',
    what: 'Operational history for source checks: attempts, discovered records, imports, failures, source timestamps and the daily schedule, with a manual check action.',
    coverage: 'A check date records an attempt, not a new publication or a complete successful import. Partial and failed runs remain visible; changing the schedule or running a check changes collection operations.',
    related: [
      { href: '/rules', label: 'Rules & updates' },
      { href: '/cases', label: 'Court rulings' },
      { href: '/settings', label: 'AI settings' }
    ]
  },
  settings: {
    label: 'Site operations',
    what: 'Shared configuration for optional AI summary providers, including encrypted keys, model identifiers, connection tests and enable or disable controls.',
    coverage: 'AI summaries are a reading aid for collected case records; official documents remain readable without a provider. Provider settings affect summary generation, not the official metadata or source links.',
    related: [
      { href: '/cases', label: 'Court rulings' },
      { href: '/monitoring', label: 'Monitoring' }
    ]
  }
};

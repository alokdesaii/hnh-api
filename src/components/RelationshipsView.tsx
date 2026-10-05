import React from 'react';
import { RELATIONSHIP_TYPES } from '../data/apiSpec';
import { PageHead } from './EndpointDocView';

export const RelationshipsView: React.FC = () => (
  <div className="max-w-[760px]">
    <PageHead section="1.17" kicker="Reference" title="Relationship">
      <p className="mt-3 text-[15px] text-ink-2 leading-relaxed max-w-[62ch]">
        Accepted values for <code className="text-ink">Relationship</code>, which is required in §1.2 when <code className="text-ink">PaymentType</code> is <code className="text-ink">C2C</code>. Any other value returns <code className="text-fail">HH5001</code> ValidationFailed.
      </p>
    </PageHead>

    <div className="folio grid grid-cols-2 sm:grid-cols-4 overflow-hidden">
      {RELATIONSHIP_TYPES.map((rel) => (
        <code key={rel} className="px-4 py-3 text-[13px] text-ink border-b border-r border-rule-soft">
          {rel}
        </code>
      ))}
    </div>
  </div>
);

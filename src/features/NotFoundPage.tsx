import { Link } from 'react-router-dom'
import { Card, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <div className="page">
      <Card>
        <CardBody>
          <div className="not-found">
            {/* Every other route names itself with an h1, so this one promotes
                the empty-state title rather than adding a second copy. */}
            <EmptyState
              icon="search"
              titleAs="h1"
              title="Page not found"
              body="That route does not exist in this demo. Head back to the shift overview to continue."
              action={
                <Link className="btn btn-primary" to="/">
                  Back to shift overview
                </Link>
              }
            />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

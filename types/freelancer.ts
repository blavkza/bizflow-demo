export interface FreelancerForUserLinking {
  id: string;
  freelancerNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string;
  status: string;
  avatar: string | null;
  isLinked?: boolean;
  department?: {
    id: string;
    name: string;
  } | null;
}

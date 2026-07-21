import { Sport } from '../../models/Sport';

const getActiveSports = async () => {
  const sports = await Sport.find(
    { active: true },
    { _id: 1, name: 1 },
  )
    .sort({ name: 1 })

  return {
    sports: sports.map((sport) => ({
      id: sport._id.toString(),
      name: sport.name,
    })),
  };
};

export { getActiveSports };

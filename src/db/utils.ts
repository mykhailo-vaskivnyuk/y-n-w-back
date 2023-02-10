export const userInNetAndItsSubnets = (userIndex = 1, netIndex = 2) => `
  members.user_id = $${userIndex} AND
  (
    (
      nets.first_net_id = $${netIndex} AND
      nets.net_level >= (
        SELECT net_level FROM nets WHERE net_id = $${netIndex}
      )
    ) OR
    $${netIndex}::int ISNULL
  )
`;

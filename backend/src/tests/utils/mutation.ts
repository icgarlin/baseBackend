
export const createFolderMutation = `
mutation CreateFolder($name: String!, $parentId: ID) {
  createFolder(name: $name, parentId: $parentId) {
    ... on Folder {
      name
      parentId
      ownerId
    }
    ... on GenericError {
      code 
      message 
      path 
    }
  }
}
`



export const editUserInfoMutation = `
  mutation EditUser($userId: ID!, $info: EditProfileInfo!) {
    editUserInfo(userId: $userId, info: $info) {
      ... on Success {
        success 
      }
      ... on GenericError {
        code 
        message 
        path 
      }
    }
  }
`


export const deleteThndrMutation = `
  mutation DeleteThndr($id: ID!) {
    deleteThndrById(id: $id) {
      ... on UserError {
        code 
        message 
        path
      }
      ... on Success {
        success 
      } 
    }
  }
`

export const deleteReverbMutation = `
  mutation DeleteReverb($id: ID!) {
    deleteReverbById(id: $id) {
      ... on UserError {
        code 
        message 
        path
      }
      ... on Success {
        success 
      } 
    }
  }
`

export const registerMutation = `
  mutation Register($registration: GraphQlRegistration!, $serverId: String) {
    register(
      registration: $registration
      serverId: $serverId
    ) {
     ... on Login {
          user {
            _id
            username
            avatar
            name
            refreshToken
          }
          accessToken
     }
     ... on UserError {
          path
          code
          message
     }
     ... on GenericError {
          path
          code
          message 
     }
    }
  }
`

export const thndrMutation = `
  mutation Thndr($text: String!){
      createThndr(
        text: $text
      ) {
          userId
          createdAt
          text
      }
  }
`

export const followMutation = `
  mutation Follow($followedUsername: String!) {
      followUser(
        followedUsername: $followedUsername
      ) {
        ... on Success {
          success
        }
        ... on GenericError {
          code 
          path
          message
        }
      }
  }
`

export const unfollowMutation = `
  mutation Unfollow($unfollowedUsername: String!) {
      unfollowUser(
        unfollowedUsername: $unfollowedUsername
      ) {
        ... on Success {
          success
        }
        ... on GenericError {
          code 
          path
          message
        }
      }
  }
`


export const feedQuery = `
  query GetFeed($cursor: String!, $limit: Int!) {
      thndrs(
        cursor: $cursor,
        limit: $limit
      ) {
        edges {
          id
          createdAt
          text
          files
        }
        pageInfo {
          hasNextPage
        }
      }
  }
`
export const driveMutation = `
  mutation AddToDrive($key: String!, $size: Int!) { 
      uploadFileToDrive(
        key: $key,
        size: $size
      ) {
        ... on File {
          key
        }
        ... on GenericError {
          code
          path
          message
        }
      }
  }
`



export const changeFileNameMutation = `
  mutation ChangeFileName($name: String!, $fileId: ID!) { 
      changeFileName(
        name: $name,
        fileId: $fileId
      ) {
        ... on Success {
          success
        }
        ... on GenericError {
          code 
          path
          message
        } 
      }
  }
`
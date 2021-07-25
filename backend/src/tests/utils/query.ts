export const rootFolderQuery = `
  query GetRootFolders($folderSortOptions: FolderSortOptionsInput!, $limit: Int!, $cursor: String) {
    getRootFolders(folderSortOptions: $folderSortOptions, limit: $limit, cursor: $cursor) {
      ... on FolderList {
        folders {
          _id
          name
          parentId
        }
      }
      ... on GenericError {
        code
        path
        message 
      }
    }
  }

`
export const preSignedUrlQuery =`
  query GetPreSignedUrls($files: [GUpload!]!) {
    getPreSignedUrlsfiles:(files: $files) {
      ... on PreSignedUrls {
        urls 
      }
      ... on GenericError {
        code 
        message
        path
      }
    }
  }
`

export const userFilesQuery =`
query QueryUserFiles($driveSections: DriveSections) {
  queryUserFiles(driveSections: $driveSections) {
    ... on File { 
        _id
        name
        size
        type
        ownerId
    }
  }
}
`

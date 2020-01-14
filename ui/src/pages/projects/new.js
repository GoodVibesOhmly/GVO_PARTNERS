/** @jsx jsx */
import { useState } from 'react'
import Layout from '../../components/Layout'
import { Grid } from '@theme-ui/components'
import { Styled, jsx, Box } from 'theme-ui'
import { navigate } from 'gatsby'
import ipfs from '../../services/ipfs'
import fetch from 'isomorphic-fetch'

import ProjectForm from '../../components/ProjectForm'
import { useEverestContract, useAddress } from '../../utils/hooks'

const NewProject = ({ data, ...props }) => {
  const [isDisabled, setIsDisabled] = useState(true)
  const [project, setProject] = useState({
    name: '',
    description: '',
    logoName: '',
    logoUrl: '',
    imageName: '',
    imageUrl: '',
    website: '',
    github: '',
    twitter: '',
    isRepresentative: null,
    categories: [],
  })
  const [everestContract] = useState(useEverestContract())
  const [address] = useAddress()

  const uploadImage = async (e, field) => {
    const image = e.target.files[0]
    if (image) {
      const reader = new window.FileReader()
      reader.readAsArrayBuffer(image)
      reader.onloadend = async () => {
        const buffer = await Buffer.from(reader.result)
        await ipfs.add(buffer, async (err, res) => {
          if (err) {
            console.error('Error saving doc to IPFS: ', err)
          }
          if (res) {
            const url = `https://ipfs.infura.io:5001/api/v0/cat?arg=${res[0].hash}`
            if (field === 'logo') {
              setProject(state => ({
                ...state,
                logoUrl: url,
                logoName: image.name,
              }))
            } else {
              setProject(state => ({
                ...state,
                imageUrl: url,
                imageName: image.name,
              }))
            }
          }
        })
      }
    }
  }

  const handleSubmit = async project => {
    setIsDisabled(true)
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: process.env.GATSBY_PINATA_API_KEY,
        pinata_secret_api_key: process.env.GATSBY_PINATA_API_SECRET_KEY,
      },
      body: JSON.stringify(project),
    })
      .then(async function(response) {
        const responseJSON = await response.json()
        if (responseJSON.IpfsHash) {
          let sigV,
            sigR,
            sigS = undefined
          let offChainDataName =
            '0x50726f6a65637444617461000000000000000000000000000000000000000000'

          // TODO: call the correct contract function
          // If user doesn't exist in Everest - call applySignedWithAttribute
          const transaction = await everestContract.applySignedWithAttribute(
            address, // project's identity - figure out what this should be
            sigV,
            sigR,
            sigS,
            address, // this is the "owner" ?
            offChainDataName,
            responseJSON.IpfsHash,
            3156895760, // unix timestamp in seconds for Jan 12, 2070
          )
        }
        navigate('/project/ck3t4oggr8ylh0922vgl9dwa9')
      })
      .catch(function(error) {
        setIsDisabled(false)
        console.error('Error uploading data to Pinata IPFS: ', error)
      })
  }

  const setValue = async (field, value) => {
    await setProject(state => ({
      ...state,
      [field]: value,
    }))
  }

  const setDisabled = value => {
    if (typeof value === 'string') {
      setIsDisabled(
        !(
          value.length > 0 &&
          project.categories &&
          project.categories.length > 0
        ),
      )
    } else {
      setIsDisabled(
        !(
          value.length > 0 &&
          project.description !== '' &&
          project.name !== ''
        ),
      )
    }
  }

  return (
    <Layout sx={{ backgroundColor: 'secondary' }} {...props}>
      <Grid
        sx={{ gridTemplateColumns: ['1fr', '312px 1fr'], position: 'relative' }}
        gap={[1, 4, 8]}
      >
        <Box>
          <Styled.h1 sx={{ color: 'white', mb: 3 }}>Add Project</Styled.h1>
          <p sx={{ variant: 'text.field' }}>
            Add a project to the Everest registry, a universally shared list of
            projects in Web3. <br />
            <br />
            A project can be a dApp, DAO, protocol, NGO, research group service
            provider and more! <br />
            <br />
            Make sure to tag your project's categories to allow other users to
            search for your project.
          </p>
          <p sx={{ variant: 'text.field', mt: 5 }}>Listing fee</p>
          <p sx={{ variant: 'text.displayBig', color: 'white' }}>10 DAI</p>
        </Box>
        <Box>
          <ProjectForm
            project={project}
            uploadImage={uploadImage}
            isDisabled={isDisabled}
            handleSubmit={handleSubmit}
            setValue={setValue}
            setDisabled={setDisabled}
            buttonText="Add project"
          />
        </Box>
      </Grid>
    </Layout>
  )
}

export default NewProject

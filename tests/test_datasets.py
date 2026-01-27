def test_list_datasets_empty(client):
    response = client.get("/datasets")
    assert response.status_code == 200
    assert response.json() == []


def test_create_dataset(client):
    response = client.post("/datasets", json={"title": "Test Dataset"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Dataset"
    assert "uid" in data


def test_get_dataset(client):
    create_response = client.post("/datasets", json={"title": "My Dataset"})
    uid = create_response.json()["uid"]

    response = client.get(f"/datasets/{uid}")
    assert response.status_code == 200
    assert response.json()["title"] == "My Dataset"


def test_get_dataset_not_found(client):
    response = client.get("/datasets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_update_dataset(client):
    create_response = client.post("/datasets", json={"title": "Old Title"})
    uid = create_response.json()["uid"]

    response = client.put(f"/datasets/{uid}", json={"title": "New Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


def test_update_dataset_not_found(client):
    response = client.put("/datasets/00000000-0000-0000-0000-000000000000", json={"title": "X"})
    assert response.status_code == 404


def test_delete_dataset(client):
    create_response = client.post("/datasets", json={"title": "To Delete"})
    uid = create_response.json()["uid"]

    response = client.delete(f"/datasets/{uid}")
    assert response.status_code == 204

    get_response = client.get(f"/datasets/{uid}")
    assert get_response.status_code == 404


def test_delete_dataset_not_found(client):
    response = client.delete("/datasets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_create_dataset_with_all_fields(client):
    response = client.post("/datasets", json={
        "title": "Full Dataset",
        "source_ep": "endpoint-123",
        "metadata": {"key": "value"}
    })
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Full Dataset"
    assert data["source_ep"] == "endpoint-123"
    assert data["metadata"] == {"key": "value"}

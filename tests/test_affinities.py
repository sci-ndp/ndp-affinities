def test_list_affinities_empty(client):
    response = client.get("/affinities")
    assert response.status_code == 200
    assert response.json() == []


def test_create_affinity(client):
    dataset = client.post("/datasets", json={"title": "DS"}).json()
    endpoint = client.post("/ep", json={"kind": "http"}).json()
    service = client.post("/services", json={"type": "compute"}).json()

    response = client.post("/affinities", json={
        "dataset_uid": dataset["uid"],
        "endpoint_uids": [endpoint["uid"]],
        "service_uids": [service["uid"]],
        "version": 1
    })
    assert response.status_code == 201
    data = response.json()
    assert data["dataset_uid"] == dataset["uid"]
    assert data["endpoint_uids"] == [endpoint["uid"]]
    assert data["service_uids"] == [service["uid"]]
    assert data["version"] == 1
    assert "triple_uid" in data


def test_get_affinity(client):
    create_response = client.post("/affinities", json={"version": 1})
    triple_uid = create_response.json()["triple_uid"]

    response = client.get(f"/affinities/{triple_uid}")
    assert response.status_code == 200
    assert response.json()["version"] == 1


def test_get_affinity_not_found(client):
    response = client.get("/affinities/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_update_affinity(client):
    create_response = client.post("/affinities", json={"version": 1})
    triple_uid = create_response.json()["triple_uid"]

    response = client.put(f"/affinities/{triple_uid}", json={"version": 2})
    assert response.status_code == 200
    assert response.json()["version"] == 2


def test_update_affinity_not_found(client):
    response = client.put("/affinities/00000000-0000-0000-0000-000000000000", json={"version": 1})
    assert response.status_code == 404


def test_delete_affinity(client):
    create_response = client.post("/affinities", json={"version": 1})
    triple_uid = create_response.json()["triple_uid"]

    response = client.delete(f"/affinities/{triple_uid}")
    assert response.status_code == 204

    get_response = client.get(f"/affinities/{triple_uid}")
    assert get_response.status_code == 404


def test_delete_affinity_not_found(client):
    response = client.delete("/affinities/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_create_affinity_with_attrs(client):
    response = client.post("/affinities", json={
        "attrs": {"quality": "high", "priority": 1},
        "version": 3
    })
    assert response.status_code == 201
    data = response.json()
    assert data["attrs"] == {"quality": "high", "priority": 1}
